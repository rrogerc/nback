# Dual N-Back

A mobile-first PWA for training working memory with the [dual n-back task](https://en.wikipedia.org/wiki/N-back). Each trial presents a spatial stimulus (one of 8 positions on a 3×3 grid) and an auditory stimulus (one of 8 letter sounds) simultaneously. You press one button when the current spatial stimulus matches the one from `n` trials ago, and another when the auditory stimulus does.

## Stack

React 17 + TypeScript + Vite + `vite-plugin-pwa`. HashRouter. No backend, no tests — pure client-side. Forked from [TheLittleMister/dualnback](https://github.com/TheLittleMister/dualnback) and substantially rewritten.

## Run

```sh
npm install
npm run dev      # vite dev server
npm run build    # tsc + vite build → dist/
npm run preview  # preview the production build
```

## Controls

| Action | Desktop | Mouse | Touch |
|---|---|---|---|
| Spatial match | `A` | Left-click | Tap "Position" |
| Auditory match | `L` | Right-click | Tap "Sound" |
| Start game | `S` | Start button | Start button |
| Pause / resume | `Esc` | Pause button | Pause button |

## Settings

N-back level, trial count, feedback (color match buttons by correctness), and theme (Auto / Light / Dark) all persist in `localStorage`.

## PWA

Installable on iOS and Android. Holds a Wake Lock during gameplay so the screen stays on. Updates are surfaced via an in-app prompt when a new service worker is waiting.
