# Loopback — Game Design (v2: strategy + progression)

> Every loop, your past self comes back. It works for you, and it can kill you.

## The hook
Each 6-second loop you play is recorded and replayed forever as an **echo**. Echoes are:
- **Workers**: they collect any gem they pass over, every loop, for the rest of the run.
- **Hazards**: touching one ends the run.

So every movement is an investment decision. A long sweeping path harvests a lot in future loops
but fills the arena with danger. A tight, efficient path is safe but earns little. The level is built from your
own past choices, so no two runs are the same, and you get better by *thinking*, not only by reflexes.

## Core loop (one run)
1. Each loop spawns gems ◆ and sets a **quota** (gems needed this loop, from you *and* your echoes).
2. **Faint ◇ outlines show next loop's gems.** Your current path becomes next loop's echo, so you
   can deliberately route through future gem spots: you plant a harvester.
3. Loop ends: quota met → your path becomes a new echo and the next loop starts. Quota missed → run over.
4. Touch an echo → run over (unless shielded).
5. **Every 3 loops: draft 1 of 3 upgrade cards.** Builds change how you play.
6. Score = total gems (yours + harvested). Gems also become **shards**, a permanent currency.

Quota and gem count rise over time; echoes accumulate. Tension comes from needing more harvest while
having less room to move.

## Strategy layers
| Decision | Trade-off |
|---|---|
| Route length | More coverage = more future harvest but more future danger |
| Route placement | Hug edges (safe lanes stay open) vs. sweep the centre (where gems spawn often) |
| Next-loop gems | Grab current gems yourself or plant a route through next loop's ◇ |
| Overlap | Overlapping echo paths waste harvest potential; spread them out |
| Rewind orb ↺ | Erase your oldest echo: less clutter, but you lose a harvester |
| Draft | Defensive (Shield, Ghost Step) vs. economic (Harvester, Golden Echo) vs. mobility |

## Upgrade cards (in-run)
Base pool: **Magnet** (bigger pickup radius), **Harvester** (echoes collect from further away),
**Eraser** (remove 2 oldest echoes), **Shield** (absorb one hit, destroying that echo),
**Ghost Step** (echoes harmless longer each loop), **Sprint** (+20% speed).

Unlockable in the Lab: **Phase** (double-tap to go intangible, once per loop), **Short Memory**
(echoes expire after 6 loops), **Golden Echo** (next 2 echoes harvest double), **Tiny** (smaller hitbox),
**Bargain** (quota −1), **Rewind Surge** (rewind orbs every 2 loops).

## Meta progression (between runs): The Lab
Spend shards on:
- **New cards** for the draft pool (more build variety, not raw power)
- **Upgrades**: Spare Shield, Quick Start (draft after loop 1), Wider Draft (4 choices), Reroll
- **Skins** for the player

The game-over screen always shows how close you are to the next unlock ("12 more ◆ to unlock Phase"),
plus how much your echoes harvested. That teaches the core idea without a tutorial wall.

## Onboarding
The first runs show contextual one-line tips at loops 1–3 (quota, echoes harvest, plant routes).
Loop 1 has a quota of 1, so you can't really fail it.

## Daily Loop
Same gem layout for everyone each day (seeded) + share text. Gives a reason to return each day.

## Tech
Plain HTML5 Canvas + vanilla JS, no build step. Fixed 60 Hz simulation (deterministic replays).
WebAudio synth SFX. Haptics via Capacitor (native) / `navigator.vibrate` (web). Ships as a PWA and as
iOS/Android apps via Capacitor from the same `www/` folder.

## Next ideas
Daily leaderboard, achievements, more cards (e.g. "Mirror": next echo mirrored), boss loops with
moving hazards, alternate arenas with walls.
