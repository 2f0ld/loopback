# Store listing: copy-paste kit

Everything below is ready to paste into Google Play Console and App Store Connect.
Character limits are noted; all texts are within them.

## Names
| Field | Text | Limit |
|---|---|---|
| App name (both stores) | **Loopback: Echo Strategy** | 30 |
| Home-screen name | Loopback | n/a |
| iOS subtitle | Outplay your own past | 30 |

"Loopback" alone is likely taken on the App Store (a well-known Mac audio app uses it), so the store
name has a suffix. Check availability early. Alternatives: *Loopback: Echo Run*, *Loopback – Past Self*.

## Google Play short description (max 80)
```
Your past self returns every loop. It works for you, and it can kill you.
```

## iOS promotional text (max 170)
```
Every loop you play becomes an echo that replays your moves forever. Echoes collect gems for you, but touching one ends your run. Plan ahead. Outplay your past.
```

## Full description (both stores, max 4000)
```
Every loop, your past self comes back. It works for you, and it can kill you.

Loopback is a one-thumb strategy game about racing your own history. Each loop lasts six seconds. Collect enough gems to meet the quota, and your path is recorded. Next loop, that recording plays back as an echo, and it keeps playing forever.

Echoes are your workers: they collect every gem they pass, loop after loop.
Echoes are your obstacles: touch one and the run is over.

Every move is an investment. Sweep wide and your future echoes harvest more gems, but the arena gets crowded. Play it safe and you'll struggle to meet the rising quota. Faint outlines show where next loop's gems will appear, so you can plant a route now and let your echo collect them later.

FEATURES
• A fresh puzzle every run: the level is built from your own past moves
• Draft upgrade cards every 3 loops: Shields, Harvesters, Golden Echoes, Phase and more
• The Lab: unlock new cards, permanent upgrades and skins with the gems you collect
• 15 goals that reward clever strategies
• Daily Loop: the same gem layout for everyone, every day
• Adaptive music: every echo adds its own note to the soundtrack
• Quick runs that fit in a coffee break, with real depth
• Plays fully offline. No ads. No accounts. No data collection.

Plan ahead. Outplay your past.
```

## Keywords (iOS, max 100, comma-separated, no spaces)
```
strategy,roguelite,arcade,puzzle,time loop,ghost,echo,one thumb,offline,minimal,brain,casual
```

## Categories
- Google Play: **Game → Strategy** (tags: Casual, Offline, Single player, Abstract)
- App Store: Primary **Games**, subcategories **Strategy** and **Arcade**

## Content rating / age rating
Answer "No" to every violence, sexuality, language, gambling, drugs, user-generated-content and
user-interaction question. The game is abstract shapes only.
- Google Play (IARC questionnaire): expected **Everyone / PEGI 3 / USK 0**
- App Store age rating: **4+**

## Target audience (Google Play)
Choose **13 and over** unless you specifically want to market to children. Selecting under-13 age
groups puts the app under the stricter Families Policy. The game is suitable for kids either way.

## Google Play: Data safety form
- Does your app collect or share any of the required user data types? **No**
- Is all user data encrypted in transit? (not applicable, no data leaves the device)
- Do you provide a way for users to request that their data is deleted? **Not applicable** (progress
  is stored on-device only; Settings → Reset all progress deletes it)

## Google Play: other declarations
- Ads: **No ads**
- In-app purchases: **None**
- App access: **All functionality is available without special access**
- Government app / financial features / health: **No**
- News app: **No**

## App Store: App Privacy
- Data collection: **Data Not Collected**
- Tracking: **No**
- Export compliance: already declared in the app (`ITSAppUsesNonExemptEncryption = NO`)

## URLs you need
| Field | Value |
|---|---|
| Privacy policy | `https://<your-github-username>.github.io/<repo>/privacy.html` (see PUBLISHING.md) |
| Website / marketing URL | `https://<your-github-username>.github.io/<repo>/` (the playable web version) |
| Support email | your contact email |

## Graphics checklist
| Asset | Size | Status |
|---|---|---|
| App icon (Play) | 512×512 PNG | `www/icon-512.png` ✅ |
| App icon (iOS) | 1024×1024, no alpha | generated into the Xcode project ✅ |
| Feature graphic (Play) | 1024×500 | ❌ make with the Midjourney banner prompt |
| Phone screenshots (Play) | 1080×1920, 2–8 | `store/screenshots/google-play/` ✅ |
| iPhone 6.9" screenshots | 1320×2868, 1–10 | `store/screenshots/app-store-6.9/` ✅ |

Regenerate screenshots any time with `npm run screenshots`.
