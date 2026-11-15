// Pure, dependency-free calculations for the tools (1RM estimates, plate loading).

/* ---------- one-rep max ---------- */

/** Epley: w × (1 + reps / 30). A single rep is its own 1RM. Null for non-positive input. */
export function epley(weightKg: number, reps: number): number | null {
  if (!Number.isFinite(weightKg) || !Number.isFinite(reps) || weightKg <= 0 || reps < 1) return null;
  if (reps === 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

/** Brzycki: w × 36 / (37 − reps). Undefined from 37 reps up. */
export function brzycki(weightKg: number, reps: number): number | null {
  if (!Number.isFinite(weightKg) || !Number.isFinite(reps) || weightKg <= 0 || reps < 1 || reps >= 37) return null;
  return (weightKg * 36) / (37 - reps);
}

export interface PercentRow {
  percent: number;
  loadKg: number;
  /** Load rounded to the nearest 2.5 kg, the smallest jump on most barbells. */
  roundedKg: number;
  reps: string;
  focus: 'strength' | 'hypertrophy' | 'endurance';
}

const REP_TARGETS: { percent: number; reps: string }[] = [
  { percent: 95, reps: '1–2' },
  { percent: 90, reps: '3–4' },
  { percent: 85, reps: '5–6' },
  { percent: 80, reps: '7–8' },
  { percent: 75, reps: '9–10' },
  { percent: 70, reps: '11–12' },
  { percent: 65, reps: '13–15' },
  { percent: 60, reps: '16–20' },
  { percent: 55, reps: '20–24' },
  { percent: 50, reps: '25–30' },
];

/** 95 % down to 50 % of the given 1RM with commonly quoted rep targets. */
export function percentTable(oneRepMaxKg: number): PercentRow[] {
  if (!Number.isFinite(oneRepMaxKg) || oneRepMaxKg <= 0) return [];
  return REP_TARGETS.map(({ percent, reps }) => {
    const loadKg = (oneRepMaxKg * percent) / 100;
    return {
      percent,
      loadKg: Math.round(loadKg * 10) / 10,
      roundedKg: Math.round(loadKg / 2.5) * 2.5,
      reps,
      focus: percent >= 85 ? 'strength' : percent >= 65 ? 'hypertrophy' : 'endurance',
    };
  });
}

/* ---------- plate loading ---------- */

export const BAR_OPTIONS_KG = [20, 15, 10] as const;
export const PLATE_OPTIONS_KG = [25, 20, 15, 10, 5, 2.5, 1.25] as const;

export interface PlateStack {
  plateKg: number;
  count: number;
}

export interface PlateResult {
  barKg: number;
  targetKg: number;
  /** Bar plus loaded plates; the nearest achievable weight to the target. */
  achievedKg: number;
  exact: boolean;
  /** Plates for ONE side, heaviest first. */
  perSide: PlateStack[];
  perSideKg: number;
  /** Nearest achievable weights on either side of the target, when it is not exact. */
  lowerKg: number | null;
  higherKg: number | null;
}

// All supported plates are multiples of 0.25 kg, so the search runs on integers.
const UNIT = 0.25;

/**
 * Fewest plates per side that reach the target, assuming unlimited pairs of
 * each enabled size. Uses an exact search rather than a greedy pick, so e.g.
 * 30 kg per side with only 20s and 15s resolves to 15 + 15.
 */
export function solvePlates(targetKg: number, barKg: number, availableKg: readonly number[]): PlateResult {
  const bar = Number.isFinite(barKg) && barKg > 0 ? barKg : 0;
  const target = Number.isFinite(targetKg) ? targetKg : 0;
  const sizes = [...new Set(availableKg.filter((p) => Number.isFinite(p) && p > 0).map((p) => Math.round(p / UNIT)))]
    .filter((u) => u > 0)
    .sort((a, b) => b - a);
  const empty: PlateResult = { barKg: bar, targetKg: target, achievedKg: bar, exact: target === bar, perSide: [], perSideKg: 0, lowerKg: null, higherKg: null };
  const wantUnits = (target - bar) / 2 / UNIT;
  if (!(wantUnits > 0) || sizes.length === 0) {
    return { ...empty, higherKg: wantUnits > 0 || target >= bar ? null : bar };
  }

  const limit = Math.ceil(wantUnits) + sizes[0];
  const fewest = new Array<number>(limit + 1).fill(Infinity);
  const lastPlate = new Array<number>(limit + 1).fill(0);
  fewest[0] = 0;
  for (let total = 1; total <= limit; total += 1) {
    for (const size of sizes) {
      if (size > total) continue;
      const candidate = fewest[total - size] + 1;
      // Sizes are visited heaviest first, so ties keep the heavier plate.
      if (candidate < fewest[total]) {
        fewest[total] = candidate;
        lastPlate[total] = size;
      }
    }
  }

  let lower = Math.floor(wantUnits);
  while (lower > 0 && fewest[lower] === Infinity) lower -= 1;
  let higher = Math.ceil(wantUnits);
  while (higher <= limit && fewest[higher] === Infinity) higher += 1;
  const hasHigher = higher <= limit;
  const exact = lower === wantUnits;
  const pick = exact || !hasHigher || wantUnits - lower <= higher - wantUnits ? lower : higher;

  const counts = new Map<number, number>();
  for (let rest = pick; rest > 0; rest -= lastPlate[rest]) {
    counts.set(lastPlate[rest], (counts.get(lastPlate[rest]) ?? 0) + 1);
  }
  const perSide = [...counts.entries()].sort((a, b) => b[0] - a[0]).map(([units, count]) => ({ plateKg: units * UNIT, count }));
  const totalOf = (units: number) => bar + units * UNIT * 2;
  return {
    barKg: bar,
    targetKg: target,
    achievedKg: totalOf(pick),
    exact,
    perSide,
    perSideKg: pick * UNIT,
    lowerKg: exact ? null : totalOf(lower),
    higherKg: exact || !hasHigher ? null : totalOf(higher),
  };
}
