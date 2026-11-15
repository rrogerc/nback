# AGENTS.md

Dual N-Back is a client-only React PWA for training working memory with the [dual n-back task](https://en.wikipedia.org/wiki/N-back). There is no backend, no test suite, and no linter. It was forked from [TheLittleMister/dualnback](https://github.com/TheLittleMister/dualnback) and substantially rewritten.

This is the only documentation in the repo. It covers what the app does, what you need to change it safely, and how it is hosted.

## The game

Every 3 seconds a trial presents two stimuli at once: a position (one of the 8 outer cells of a 3x3 grid) and a sound (one of 8 letter sounds). The player signals when the current position matches the one from `n` trials back, and separately when the sound does.

| Action | Keyboard | Mouse | Touch |
|---|---|---|---|
| Position match | `A` | Left-click | Tap "Position" or the grid |
| Sound match | `L` | Right-click | Tap "Sound" |
| Start game | `S` | Start button | Start button |
| Pause or resume | `Esc` | Pause button | Pause button or Back |

Settings are on the home page and persist in `localStorage`: n-back level, trial count, feedback, and theme (Auto, Light, Dark). With feedback on, a pressed match button turns green or red by correctness and a live score shows during the game. With it off, the button turns blue and the score stays hidden until the end.

## Commands

| Command | Use |
|---|---|
| `npm install` | Install dependencies. |
| `npm run dev` | Vite dev server with hot reload. The service worker is build-only, so it is absent here. |
| `npx tsc` | Typecheck only. `noEmit` is set, so it writes nothing and takes about a second. |
| `npm run build` | `tsc && vite build` into `dist/`. On the host Mac this is a deploy. Read the next section first. |

With no tests, verifying a change means `npx tsc` plus exercising it in a browser.

## Building is deploying

The app is hosted on the owner's Mac ("the host Mac") by a background server that reads `dist/` from disk on every request. The moment `npm run build` finishes, that build is live. There is no staging step and no restart.

- To check types, run `npx tsc`, not `npm run build`.
- Build only when the working tree is worth shipping. `.claude/settings.local.json` pre-approves `npm run build`, so no prompt will stop you.
- `dist/` is gitignored, so git cannot restore it. A bad build stays live until the next good one.
- Open tabs do not switch silently. The old service worker keeps serving the previous build and the app shows an "Update available" prompt. When verifying a build, use a fresh browser profile or press Reload on that prompt first. Otherwise you are testing the previous version.

## Local hosting

The app lives at **http://nback.localhost:6225**, reachable only from the host Mac.

A launchd agent named `net.rrogerc.nback` runs this from the repo root:

```sh
/opt/homebrew/bin/node node_modules/.bin/vite preview --host 127.0.0.1 --port 6225 --strictPort
```

Its definition is `~/Library/LaunchAgents/net.rrogerc.nback.plist`. That file is machine-local and not part of this repo. It sets `RunAtLoad` and `KeepAlive`, so the server starts at login and respawns if it exits, and it logs to `~/Library/Logs/nback.log`. On a new machine, recreate the plist from these properties.

Each choice is deliberate. Do not change one without asking.

- **`vite preview`, not `vite dev`.** Only the production build has the service worker. Preview reads `dist/` per request and sends `Cache-Control: no-cache` with ETags, which is why a rebuild needs no restart.
- **`--host 127.0.0.1`.** Loopback only. Vite's preview server is not built to face a network, and nothing off this machine uses it.
- **`--port 6225 --strictPort`.** Browsers key `localStorage` and the service worker by scheme, host, and port. Changing the port or the hostname silently resets saved settings and orphans the cached app. `--strictPort` turns a port conflict into an error in the log instead of a quiet move to 6226.
- **The `nback.localhost` name.** Every `*.localhost` name resolves to loopback, and it is the only made-up hostname browsers treat as a secure context over plain HTTP. The service worker and Wake Lock both need a secure context. Any other name or address (a hosts-file entry, `.local`, a LAN IP) is not one, so both features quietly disappear. `http://localhost:6225` also works but is a separate origin with its own storage, so use the named URL.
- **The port stays in the URL.** macOS lets a non-root process bind port 80 on all interfaces but not on loopback alone. A port-free URL would mean exposing the server to the network or running something as root. This was considered and declined.

Operating it:

```sh
launchctl print gui/$(id -u)/net.rrogerc.nback | grep -E "state|pid"              # status
launchctl kickstart -k gui/$(id -u)/net.rrogerc.nback                             # restart
launchctl bootout gui/$(id -u)/net.rrogerc.nback                                  # stop and unload
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/net.rrogerc.nback.plist   # load
```

Restart only after changing `vite.config.ts` or dependencies. After editing the plist, run `bootout` then `bootstrap`, because `kickstart` does not re-read it.

Last verified 2026-11-09 on macOS 26.5 with Vite 6.4, in Zen 1.24 and Chrome 157.

### What is not set up

- **No public deployment.** The app was hosted on GitHub Pages, then on Vercel, and the local hosting above replaced both. The Vercel project was deleted on 2026-11-10 and GitHub Pages was switched off on 2026-11-15, so a push now reaches only GitHub. Do not deploy anywhere unless asked.
- **No access from other devices, phones included.** Serving the full app to a phone needs real HTTPS, for the same secure-context reason. The option scoped so far is Tailscale Serve. It needs HTTPS certificates enabled for the tailnet and the phone joined to it, which only the owner can do, plus `preview: { allowedHosts: [".ts.net"] }` in `vite.config.ts`, because Vite answers 403 to any hostname that is not an IP or `*.localhost`.
- **Device testing in the meantime.** Audio does not need a secure context, so `npm run dev -- --host` on the same Wi-Fi should be enough for a one-off test on a phone, without the service worker or Wake Lock. This route is untested here, and it exposes the dev server to the local network, so ask first and stop it afterwards.

## Code map

- `src/main.tsx`, `src/App.tsx`: React 18 root with `HashRouter`. `/` is `src/pages/Home` (settings and Start). `/game` is `src/pages/GamePage`, which renders `Game`.
- `src/components/Game/Game.tsx`: owns `GameState` and `ScoreState`. Shows `Board` during a game and `Score` afterwards.
- `src/components/Game/Board/Board.tsx`: the core. Game loop, input, pause, Wake Lock, and the back-button trap. Read all of it before changing timing.
- `src/audio.ts`: one shared `AudioContext`, sound loading and caching, unlock, resume, and play.
- `src/constants.ts`: timing (one trial every 3 s, stimulus visible for half of it), bounds, key bindings, and the `localStorage` keys `task`, `trials`, `feedback`, and `theme`.
- `src/utils/utils.tsx`: the n-back match check, game-length math, and scoring. Each modality scores `TP / (TP + FP + FN)`, so correct rejections do not count, and the headline score is the mean of the two.
- Styling: a CSS Module beside each component, read as `classes["kebab-name"]`, with global variables and themes in `src/index.css`. The root font size is 62.5%, so `1rem` is 10px. The theme is a `data-theme` attribute on `<html>`, applied by an inline script in `index.html` before first paint.
- PWA: `vite-plugin-pwa` in `generateSW` mode with `registerType: "prompt"`. The manifest is the hand-written `public/manifest.json`. JS, CSS, HTML, icons, and the WAV files are all precached, so the app runs offline after one load.

## Easy to break

- **iOS audio unlock.** `unlockAudio()` must run synchronously inside the gesture that starts a game, which today is `startGame` in `Home.tsx`. Put nothing asynchronous ahead of it: no `await`, no timer. `resumeAudio()` runs on every in-game input and on `visibilitychange` because iOS suspends the context when the app is backgrounded, and `playSound()` skips rather than schedule into a context that is not running. Several commits went into getting this right, and with no phone access there is no way to re-check it on a device, so change this code only with a concrete reason. A temporary on-screen diagnostics overlay for it has been removed. If on-device debugging is needed again, it is in git history: `git show e71c63a:src/components/AudioDiagnostics.tsx`, with its counters in that commit's `src/audio.ts`.
- **Input depends on DOM ids.** `Board` listens on `window` and identifies targets through `resolveId`, which checks an element's id, then its parent's, then its grandparent's. The match buttons carry the ids `KeyA` and `KeyL`, hardcoded in `Keys.tsx` to equal `KEY_SPATIAL` and `KEY_AUDITORY`. Mouse clicks count when the target resolves to `game` (left is position, right is sound), and on touch a tap anywhere inside `#playableClicks` is position. Renaming or re-nesting these elements breaks input with no type error.
- **Game loop timing.** The loop is a `setTimeout` chain, not `setInterval`, so pause can record the exact time remaining and resume from it. Per-game state lives in closure variables inside one large effect, not in React state, and decoded sounds live in a ref. The duration shown beside the trials input on the home page comes from `gameDurationMs` in `utils.tsx`, which assumes one lead-in interval plus one interval per trial. Change the loop's timing and that formula has to change with it.
- **Location independence.** `base: "./"` and hash routing let the build run from any path with no server rewrites. Keep both.

## Known loose ends

- **Icons.** `favicon.ico`, `logo192.png`, `logo512.png`, and `logo512-maskable.png` in `public/` are byte-identical copies of one 213x218 PNG, so the sizes declared in `manifest.json` are not real.

## Conventions

- TypeScript is strict. Sizes are in `rem` against the 10px root.
- Commit subjects are imperative and sentence case, and describe the visible change, such as "Fix pause button under notch and results table overflow on mobile". The history has no co-author or tool-attribution trailers. Keep it that way.
