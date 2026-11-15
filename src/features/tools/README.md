# tools — 휴식 타이머 · 1RM 계산기 · 원판 계산기

Three independent, props-only components. No app state, no storage, no extra
dependencies (React + plain CSS + inline SVG). Styles live in `tools.css`
(classes prefixed `tl-`) and are imported by each component.

```tsx
import { RestTimer, OneRepMaxCalculator, PlateCalculator } from './features/tools';

<RestTimer defaultSeconds={90} onComplete={() => console.log('rest over')} />
<OneRepMaxCalculator defaultWeightKg={80} defaultReps={5} />
<PlateCalculator defaultTargetKg={100} defaultBarKg={20} />
```

Each component renders its own bordered card (`<section>` with an `<h3>`), so
place them in any grid, e.g.
`display:grid; gap:14px; grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))`.

## Props

| Component | Props (all optional) |
| --- | --- |
| `RestTimer` | `defaultSeconds?: number` (90, clamped 5–3600) · `defaultSound?: boolean` (true) · `onComplete?: () => void` · `className?: string` |
| `OneRepMaxCalculator` | `defaultWeightKg?: number` · `defaultReps?: number` · `className?: string` |
| `PlateCalculator` | `defaultTargetKg?: number` · `defaultBarKg?: number` (20 / 15 / 10) · `className?: string` |

The `default*` props are read once on mount. To re-seed a calculator for another
exercise, change its `key`.

## Behaviour notes

- **RestTimer** stores the end timestamp and derives the remaining time from
  `Date.now()`, so it stays correct when the tab is throttled or backgrounded
  (it also re-syncs on `visibilitychange` / `focus`). The beep uses WebAudio and
  is only armed after a button press; a fully suspended background tab plays it
  when the tab next runs. The vibration switch appears only where
  `navigator.vibrate` exists. Announcements go through a polite live region
  (start, pause, 30 s, 10 s, finished); the clock itself is `role="timer"`.
- **OneRepMaxCalculator** shows Epley, Brzycki and their average; the 50–95 %
  table is built from the average. Reps above 12 are allowed (up to 30) with a
  reliability warning.
- **PlateCalculator** assumes unlimited pairs of each enabled plate and finds
  the fewest plates per side with an exact search (not greedy). When the target
  cannot be met it shows the nearest weight plus the neighbours below and above.

## Pure helpers (`calc.ts`)

`epley`, `brzycki`, `percentTable`, `solvePlates`, `BAR_OPTIONS_KG`,
`PLATE_OPTIONS_KG` and the `PercentRow` / `PlateStack` / `PlateResult` types are
re-exported from the barrel.

## Theming

`.tl-root` reads the global `--accent`, `--ink`, `--border`, `--surface` and
`--selection` tokens and falls back to the FORM brand values when they are
absent. Override per instance with `--tl-accent`, `--tl-ink`, etc.
