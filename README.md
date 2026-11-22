# Night at the Vault

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/3215242167-create/best-heist-game-20261122-0559-entry/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/3215242167-create/best-heist-game-20261122-0559-entry/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

An entry for the make.fun bounty [best-heist-game-20261122-0559](https://make.fun/bounty/best-heist-game-20261122-0559).

A top-down stealth heist game in plain HTML and canvas JavaScript — no build
step, no libraries, no network requests. Open `game/index.html` in a desktop
browser (or serve the `game/` folder with any static file server) and play.

## How to play

You are a thief alone in a museum vault room after closing time. Three pieces
are waiting on their pedestals: the Star Sapphire, the Gilded Portrait and the
Vault Gold Bars. Two guards patrol the hall with sweeping vision cones and two
security cameras swing back and forth from the top corners.

- Move with **WASD** or the **arrow keys**. Press **Enter** to start, **R** to retry.
- Standing in any vision cone raises the alarm meter; slip behind a display
  case or pillar to break the line of sight and let it cool down.
- If the alarm fills up, or a guard lays a hand on you, the night is over.
- Pocket all three pieces, reach the glowing exit door, and the run is scored
  on loot value plus a speed bonus.

## Layout

- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to the
  output directory and writes `dossier.json` via `vendor/makefun-game.ts`.
- `game/` — the game itself: `index.html` plus classic scripts under
  `game/src/` (config, input, world, render, main).
- `screenshots/` — staged captures of the game's own scenes (`?scene=N`).
