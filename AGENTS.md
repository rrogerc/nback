# AGENTS.md

Dual N-Back is a native macOS app, written in SwiftUI, for training working memory with the [dual n-back task](https://en.wikipedia.org/wiki/N-back). There is no backend, no test suite, and no linter. It began as a fork of [TheLittleMister/dualnback](https://github.com/TheLittleMister/dualnback), was rewritten as a React PWA, and was ported to Swift in November 2026. The last web version is commit `21c9877`, the parent of the port.

This is the only documentation in the repo. It covers what the app does, what you need to change it safely, and how it is installed.

## The game

Every 3 seconds a trial presents two stimuli at once: a position (one of the 8 outer cells of a 3x3 grid) and a sound (one of 8 letter sounds). The player signals when the current position matches the one from `n` trials back, and separately when the sound does.

| Action | Keyboard | Mouse |
|---|---|---|
| Position match | `A` | Left-click anywhere on the board, or click Position |
| Sound match | `L` | Right-click or Control-click anywhere on the board, or click Sound |
| Start game | `S` | Start button |
| Pause or resume | `Esc` | Pause button |
| Leave the results | `Esc` | Return Home |

Settings are on the home screen and persist in UserDefaults: n-back level, trial count, feedback, and theme (Auto, Light, Dark). With feedback on, a pressed match button turns green or red by correctness and a live score shows during the game. With it off, the button turns blue and the score stays hidden until the end.

Rules, timing, scoring, and layout match the web version, down to how JavaScript rounded percentages. The deliberate differences: the system font replaces Inter, the trial count accepts whole numbers only, a mouse click on the grid counts as a position match (the web version counted only taps there), and clicking the pause button no longer also registers a position response.

## Commands

| Command | Use |
|---|---|
| `open NBack.xcodeproj` | Work in Xcode. ⌘R builds and runs a Debug copy. |
| `xcodebuild -project NBack.xcodeproj -scheme NBack -derivedDataPath build/DerivedData build` | Debug build from the command line, to check that it compiles. Output goes to `build/`, which is gitignored. |
| `scripts/install.sh` | Release build installed to `~/Applications/Dual N-Back.app`, quitting a running copy first. |
| `swift scripts/make-icon.swift NBack/Assets.xcassets/AppIcon.appiconset` | Redraw the app icon at every size. |

With no tests, verifying a change means building and then playing it. A 1-back game of 3 trials takes 12 seconds.

## Installing

The app lives at `~/Applications/Dual N-Back.app`, where Spotlight finds it. `scripts/install.sh` rebuilds and replaces it. Nothing else is set up: no server, no launch agent, no auto-update.

The project builds without an Apple developer account. It is signed ad hoc ("Sign to Run Locally"), so no team ID lives in the repo. The App Sandbox is off: a personal app gains nothing from it, and sandboxed ad hoc builds can trigger macOS's prompt about accessing another app's data after a rebuild.

Settings live in the `net.rrogerc.nback` defaults domain, and `defaults delete net.rrogerc.nback` resets them.

The web version used to be served at http://nback.localhost:6225 by a launchd agent named `net.rrogerc.nback`. The agent and its plist were removed on 2026-11-18. AGENTS.md at commit `21c9877` describes that setup if it is ever wanted back.

Last verified 2026-11-18 on macOS 26.5 with Xcode 26.2.

## Code map

- `NBack/NBackApp.swift`: the `@main` app, a single window with a hidden title bar, an app delegate that applies the theme before the window appears and quits when the window closes, and `RootView`, which switches between the three screens.
- `NBack/AppModel.swift`: which screen is showing (home, game, results), and the keyboard shortcuts through one local `NSEvent` monitor.
- `NBack/GameEngine.swift`: the core. Trial loop, responses, pause, scoring, and the process activity that keeps the display awake during a game. Read all of it before changing timing.
- `NBack/Rules.swift`: timing (one trial every 3 s, stimulus visible for half of it), bounds, defaults, and `gameDurationMs`.
- `NBack/Scoring.swift`: confusion matrices, scores, and number and time formatting. Each modality scores `TP / (TP + FP + FN)`, so correct rejections do not count, and the headline score is the mean of the two.
- `NBack/SoundBank.swift`: the eight letter sounds in `NBack/Sounds/`, loaded once with `AVAudioPlayer`.
- `NBack/Settings.swift`: UserDefaults keys, the settings a game starts with, and the theme.
- `NBack/HomeView.swift`, `NBack/GameView.swift`, `NBack/ResultsView.swift`: the three screens. `NBack/ClickCatcher.swift` reports raw mouse-downs to the board.
- `NBack/Style.swift`: the palette, the outlined button, the segmented picker, and the scale-to-fit helper.
- Sizes are points equal to the web version's CSS pixels, so `1.8rem` became `18`.
- The Xcode project uses a synchronized folder, so any file added under `NBack/` joins the target with no project edits.

## Easy to break

- **Input bypasses SwiftUI focus.** Keys go through the `NSEvent` monitor in `AppModel`, which sees them before any view. That is why `S` starts a game even while typing in the trials field, as on the web, and why every key without Command, Control, or fn is swallowed during a game, so a stray press can't beep. Mouse input comes from `ClickCatcher`, an `NSView` underneath the board, so the board has `allowsHitTesting(false)`: anything hit-testable on top would eat clicks. Clicks on Position and Sound are recognized by those buttons' frames in the `"game"` coordinate space, not by button actions.
- **Game loop timing.** Trials fall on a fixed schedule of play time: stimulus k at k × 3 s, its cell dark at +1.5 s, and the end at (trials + 1) × 3 s. Pause stops play time and resume reschedules from it. `Rules.gameDurationMs` uses the same formula for the length shown on the home screen, so change them together.
- **Rounding.** `Percent.hundredths` reproduces JavaScript's `toFixed(2)`, which rounds exact ties up where `String(format: "%.2f")` rounds them to even. A 1-in-32 hit rate reads 3.13%, as it did on the web. Keep scores as integer hundredths and format them with `Percent`.
- **Scaling.** Below 680×680 for the game and 680×740 for the results, those screens lay out at that size and scale down evenly. A small tile in a tiling window manager such as AeroSpace then shows the whole screen shrunk rather than clipped. AppKit-backed views don't scale cleanly, so `ClickCatcher` sits outside the scaled board and divides its points by the scale, and the home screen, which has a text field, doesn't scale. It fits down to the window minimum of 560×530.
- **Focus on the home screen.** macOS focuses the first text field whenever a window becomes key. The page takes default focus instead, so the trials field starts unfocused as it did on the web.
- **Sounds.** The WAV files are copied flat into the bundle's Resources and found by name, numbered 1 to 8 as h, j, k, l, q, r, s, t. A missing file leaves its trials silent rather than failing.

## Conventions

- Swift 6 language mode with `MainActor` as the default isolation, as Xcode 26 sets up new apps. Code AppKit may call off the main thread, such as dynamic color providers, is marked `nonisolated`.
- Commit subjects are imperative and sentence case, and describe the visible change, such as "Fix pause button under notch and results table overflow on mobile". The history has no co-author or tool-attribution trailers. Keep it that way.
