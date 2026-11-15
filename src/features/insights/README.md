# insights — 인사이트 패널

`InsightsPanel` turns workout logs into: this-week vs last-week tiles, a 12-week
training-day heatmap with streaks, an 8-week volume bar chart, a 4-week
per-muscle set distribution with a gentle balance hint, and per-exercise
progress (best estimated 1RM, e1RM line chart, PR badges). Charts are
hand-written inline SVG with `<title>`/`<desc>` and a "표로 보기" table toggle.
No extra dependencies. Styles live in `insights.css` (classes prefixed `ins-`).

## Integration

The panel takes its own `LogEntry` shape; map the app's records to it. With the
current `WorkoutRecord` (`weight` → `weightKg`):

```tsx
import { useMemo } from 'react';
import { InsightsPanel } from './features/insights';
import type { LogEntry } from './features/insights';
import { exercises, muscles } from './data/exercises';
import { extraExercises } from './data/exercises.extra'; // if present

const insightLogs = useMemo<LogEntry[]>(
  () => records.map((r) => ({ id: r.id, exerciseId: r.exerciseId, date: r.date, sets: r.sets, reps: r.reps, weightKg: r.weight })),
  [records],
);
const allExercises = useMemo(() => [...exercises, ...extraExercises], []);

<InsightsPanel logs={insightLogs} exercises={allExercises} muscles={muscles} onStartLogging={() => setView('library')} />
```

Pass stable (memoised) arrays: the statistics are recomputed whenever `logs`,
`exercises` or `muscles` change identity.

## Props

```ts
interface LogEntry { id: string; exerciseId: string; date: string /* YYYY-MM-DD */; sets: number; reps: number; weightKg: number }

interface InsightsPanelProps {
  logs: LogEntry[];
  exercises: Exercise[];
  muscles: { id: MuscleId; name: string }[];
  now?: Date;                  // overrides "today"; for tests and demos
  onStartLogging?: () => void; // adds a button to the empty state
  className?: string;
}
```

The panel renders a `<section>` with an `<h2>` and no outer card or page
padding. With no valid logs it renders only the empty state.

## Calculation rules (`stats.ts`)

All maths lives in pure, dependency-free functions, re-exported from the barrel:
`compareWeeks`, `trainingHeatmap`, `trainingStreaks`, `weeklyVolume`,
`muscleDistribution`, `epley1rm`, `exerciseProgress`, `loggedExercises`,
`normalizeLogs`, plus date helpers.

- Weeks start on Monday; dates are local calendar days. "This week" is Monday
  through today and is compared with the whole of last week.
- Entries with an invalid date, an empty `exerciseId`, or non-positive sets/reps
  are ignored. A missing or negative weight counts as 0 kg (bodyweight).
- Volume = sets × reps × weightKg.
- Muscle distribution: rolling 28 days ending today; primary muscle = 1 credit
  per set, secondary = 0.5 (a muscle listed as both is credited once). The
  weekly average divides by the weeks actually logged (minimum 1) when the
  first log is newer than the window. Under 4 weighted sets/week is flagged.
  Sets for exercise ids missing from `exercises` are reported separately.
- e1RM = Epley `w × (1 + reps / 30)`, only for 1–12 reps and weight > 0; a
  single rep counts as its own 1RM.
- A session is one calendar day of one exercise. A PR is a session whose best
  e1RM beats every earlier session; the first session is the baseline.
- Heatmap levels: 1–9 sets, 10–19 sets, 20+ sets per day.

## Self-check

`stats.selfcheck.ts` holds plain assertions (no test framework). Nothing imports
it. Run it with a TypeScript-aware runtime:

```sh
node --experimental-strip-types src/features/insights/stats.selfcheck.ts
```

## Theming

`.ins-root` reads the global `--accent`, `--ink`, `--border`, `--surface` and
`--selection` tokens and falls back to the FORM brand values. Override with
`--ins-accent`, `--ins-ink`, etc.
