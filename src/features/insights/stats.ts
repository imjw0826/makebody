// Pure, dependency-free statistics for the insights panel.
// Conventions: weeks start on Monday, all dates are local calendar days
// ("YYYY-MM-DD"), and every function tolerates empty or malformed input.

export interface LogEntry {
  id: string;
  exerciseId: string;
  /** Local calendar day, YYYY-MM-DD */
  date: string;
  sets: number;
  reps: number;
  weightKg: number;
}

/** Structural subset of the app's `Exercise`; the real type is assignable to it. */
export interface StatsExercise {
  id: string;
  name: string;
  primaryMuscles: readonly string[];
  secondaryMuscles: readonly string[];
}

export interface StatsMuscle {
  id: string;
  name: string;
}

export const PRIMARY_CREDIT = 1;
export const SECONDARY_CREDIT = 0.5;
/** Weighted sets per week below which a muscle is flagged as under-trained. */
export const UNDERTRAINED_SETS_PER_WEEK = 4;
/** Epley is only trusted up to this many reps. */
export const E1RM_MAX_REPS = 12;

const DAY_MS = 86_400_000;

/* ------------------------------------------------------------------ */
/* Dates. A "day number" is the count of calendar days since          */
/* 1970-01-01, built from local Y/M/D so DST shifts cannot skew it.   */
/* ------------------------------------------------------------------ */

export function dayNumberOf(date: Date): number {
  return Math.round(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS);
}

/** Parses "YYYY-MM-DD" (an ISO time suffix is ignored). Returns null for anything that is not a real calendar day. */
export function parseDateKey(value: unknown): number | null {
  if (typeof value !== 'string') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:$|[T ])/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utc = new Date(Date.UTC(year, month - 1, day));
  if (utc.getUTCFullYear() !== year || utc.getUTCMonth() !== month - 1 || utc.getUTCDate() !== day) return null;
  return Math.round(utc.getTime() / DAY_MS);
}

export function dateKeyOf(dayNumber: number): string {
  const utc = new Date(dayNumber * DAY_MS);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${utc.getUTCFullYear()}-${pad(utc.getUTCMonth() + 1)}-${pad(utc.getUTCDate())}`;
}

/** 0 = Monday … 6 = Sunday. */
export function weekdayOf(dayNumber: number): number {
  // 1970-01-01 (day 0) was a Thursday.
  return (((dayNumber + 3) % 7) + 7) % 7;
}

/** Day number of the Monday that starts the week containing `dayNumber`. */
export function weekStartOf(dayNumber: number): number {
  return dayNumber - weekdayOf(dayNumber);
}

export function todayNumber(now?: Date): number {
  const date = now instanceof Date && !Number.isNaN(now.getTime()) ? now : new Date();
  return dayNumberOf(date);
}

/* ------------------------------------------------------------------ */
/* Normalisation                                                      */
/* ------------------------------------------------------------------ */

export interface NormalizedLog {
  id: string;
  exerciseId: string;
  day: number;
  date: string;
  sets: number;
  reps: number;
  weightKg: number;
  volumeKg: number;
}

function toFinite(value: unknown): number | null {
  const n = typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN;
  return Number.isFinite(n) ? n : null;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Drops entries that cannot be counted (bad date, missing exercise, non-positive
 * sets or reps). A missing or negative weight is treated as 0 kg (bodyweight).
 */
export function normalizeLogs(logs: unknown): NormalizedLog[] {
  if (!Array.isArray(logs)) return [];
  const out: NormalizedLog[] = [];
  for (const raw of logs) {
    if (raw === null || typeof raw !== 'object') continue;
    const entry = raw as Partial<Record<keyof LogEntry, unknown>>;
    if (typeof entry.exerciseId !== 'string' || entry.exerciseId === '') continue;
    const day = parseDateKey(entry.date);
    if (day === null) continue;
    const sets = toFinite(entry.sets);
    const reps = toFinite(entry.reps);
    if (sets === null || reps === null || sets <= 0 || reps <= 0) continue;
    const weight = toFinite(entry.weightKg);
    const weightKg = weight !== null && weight > 0 ? weight : 0;
    out.push({
      id: typeof entry.id === 'string' ? entry.id : '',
      exerciseId: entry.exerciseId,
      day,
      date: dateKeyOf(day),
      sets,
      reps,
      weightKg,
      volumeKg: sets * reps * weightKg,
    });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Weekly summary                                                     */
/* ------------------------------------------------------------------ */

export interface WeekTotals {
  workoutDays: number;
  totalSets: number;
  volumeKg: number;
}

function totalsBetween(logs: readonly NormalizedLog[], fromDay: number, toDay: number): WeekTotals {
  const days = new Set<number>();
  let totalSets = 0;
  let volumeKg = 0;
  for (const log of logs) {
    if (log.day < fromDay || log.day > toDay) continue;
    days.add(log.day);
    totalSets += log.sets;
    volumeKg += log.volumeKg;
  }
  return { workoutDays: days.size, totalSets: round2(totalSets), volumeKg: round2(volumeKg) };
}

export interface WeekComparison {
  thisWeekStart: string;
  lastWeekStart: string;
  thisWeek: WeekTotals;
  lastWeek: WeekTotals;
  /** thisWeek − lastWeek */
  delta: WeekTotals;
}

/** This week (Monday through today) against the whole of last week. */
export function compareWeeks(logs: readonly LogEntry[], now?: Date): WeekComparison {
  const norm = normalizeLogs(logs);
  const today = todayNumber(now);
  const start = weekStartOf(today);
  const thisWeek = totalsBetween(norm, start, today);
  const lastWeek = totalsBetween(norm, start - 7, start - 1);
  return {
    thisWeekStart: dateKeyOf(start),
    lastWeekStart: dateKeyOf(start - 7),
    thisWeek,
    lastWeek,
    delta: {
      workoutDays: thisWeek.workoutDays - lastWeek.workoutDays,
      totalSets: round2(thisWeek.totalSets - lastWeek.totalSets),
      volumeKg: round2(thisWeek.volumeKg - lastWeek.volumeKg),
    },
  };
}

/* ------------------------------------------------------------------ */
/* Heatmap and streaks                                                */
/* ------------------------------------------------------------------ */

export type HeatLevel = 0 | 1 | 2 | 3;

export interface HeatDay {
  date: string;
  /** 0 = Monday … 6 = Sunday */
  weekday: number;
  sets: number;
  volumeKg: number;
  level: HeatLevel;
  isToday: boolean;
  isFuture: boolean;
}

export interface HeatWeek {
  weekStart: string;
  days: HeatDay[];
  workoutDays: number;
  totalSets: number;
}

export interface TrainingHeatmap {
  weeks: HeatWeek[];
  activeDays: number;
}

/** 0 sets → 0, 1–9 → 1, 10–19 → 2, 20+ → 3. */
export function heatLevel(sets: number): HeatLevel {
  if (!(sets > 0)) return 0;
  if (sets < 10) return 1;
  if (sets < 20) return 2;
  return 3;
}

/** `weeks` full Monday–Sunday columns ending with the current week (oldest first). */
export function trainingHeatmap(logs: readonly LogEntry[], now?: Date, weeks = 12): TrainingHeatmap {
  const count = Math.max(1, Math.floor(Number.isFinite(weeks) ? weeks : 12));
  const norm = normalizeLogs(logs);
  const today = todayNumber(now);
  const firstDay = weekStartOf(today) - 7 * (count - 1);
  const perDay = new Map<number, { sets: number; volumeKg: number }>();
  for (const log of norm) {
    if (log.day < firstDay || log.day > today) continue;
    const slot = perDay.get(log.day) ?? { sets: 0, volumeKg: 0 };
    slot.sets += log.sets;
    slot.volumeKg += log.volumeKg;
    perDay.set(log.day, slot);
  }
  const out: HeatWeek[] = [];
  let activeDays = 0;
  for (let w = 0; w < count; w += 1) {
    const start = firstDay + w * 7;
    const days: HeatDay[] = [];
    let workoutDays = 0;
    let totalSets = 0;
    for (let d = 0; d < 7; d += 1) {
      const day = start + d;
      const slot = perDay.get(day);
      const sets = slot ? round2(slot.sets) : 0;
      if (sets > 0) {
        workoutDays += 1;
        totalSets += sets;
      }
      days.push({
        date: dateKeyOf(day),
        weekday: d,
        sets,
        volumeKg: slot ? round2(slot.volumeKg) : 0,
        level: heatLevel(sets),
        isToday: day === today,
        isFuture: day > today,
      });
    }
    activeDays += workoutDays;
    out.push({ weekStart: dateKeyOf(start), days, workoutDays, totalSets: round2(totalSets) });
  }
  return { weeks: out, activeDays };
}

export interface Streaks {
  /** Consecutive workout days ending today (or yesterday, if today has no log yet). */
  currentDays: number;
  longestDays: number;
  /** Consecutive weeks with at least one workout, ending this week (or last week). */
  currentWeeks: number;
  longestWeeks: number;
  lastWorkoutDate: string | null;
}

function runLengths(sortedUnique: readonly number[], step: number, anchor: number): { current: number; longest: number } {
  if (sortedUnique.length === 0) return { current: 0, longest: 0 };
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sortedUnique.length; i += 1) {
    run = sortedUnique[i] - sortedUnique[i - 1] === step ? run + 1 : 1;
    if (run > longest) longest = run;
  }
  const last = sortedUnique[sortedUnique.length - 1];
  // `run` now holds the length of the run that ends at `last`.
  const current = last === anchor || last === anchor - step ? run : 0;
  return { current, longest };
}

/** Logs dated after today are ignored. */
export function trainingStreaks(logs: readonly LogEntry[], now?: Date): Streaks {
  const today = todayNumber(now);
  const days = [...new Set(normalizeLogs(logs).map((l) => l.day).filter((d) => d <= today))].sort((a, b) => a - b);
  const weeks = [...new Set(days.map(weekStartOf))].sort((a, b) => a - b);
  const dayRuns = runLengths(days, 1, today);
  const weekRuns = runLengths(weeks, 7, weekStartOf(today));
  return {
    currentDays: dayRuns.current,
    longestDays: dayRuns.longest,
    currentWeeks: weekRuns.current,
    longestWeeks: weekRuns.longest,
    lastWorkoutDate: days.length > 0 ? dateKeyOf(days[days.length - 1]) : null,
  };
}

/* ------------------------------------------------------------------ */
/* Weekly volume                                                      */
/* ------------------------------------------------------------------ */

export interface WeekBucket extends WeekTotals {
  weekStart: string;
  weekEnd: string;
  isCurrent: boolean;
}

/** Calendar weeks, oldest first, ending with the current (partial) week. */
export function weeklyVolume(logs: readonly LogEntry[], now?: Date, weeks = 8): WeekBucket[] {
  const count = Math.max(1, Math.floor(Number.isFinite(weeks) ? weeks : 8));
  const norm = normalizeLogs(logs);
  const today = todayNumber(now);
  const currentStart = weekStartOf(today);
  const out: WeekBucket[] = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const start = currentStart - 7 * i;
    const end = i === 0 ? today : start + 6;
    out.push({
      weekStart: dateKeyOf(start),
      weekEnd: dateKeyOf(start + 6),
      isCurrent: i === 0,
      ...totalsBetween(norm, start, end),
    });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Muscle distribution                                                */
/* ------------------------------------------------------------------ */

export interface MuscleLoad {
  muscleId: string;
  name: string;
  /** Primary = 1 credit per set, secondary = 0.5. */
  weightedSets: number;
  setsPerWeek: number;
  /** Share of all weighted sets, 0–1. */
  share: number;
  undertrained: boolean;
}

export interface MuscleDistribution {
  items: MuscleLoad[];
  undertrained: MuscleLoad[];
  totalWeightedSets: number;
  /** Sets logged for exercises that are not in the `exercises` list. */
  unmatchedSets: number;
  windowStart: string;
  windowEnd: string;
  /** Weeks used as the divisor; shorter than `weeks` when logging began inside the window. */
  effectiveWeeks: number;
  hasData: boolean;
}

/**
 * Rolling window of `weeks * 7` days ending today. When the very first log is
 * newer than the window, the average is taken over the time actually logged
 * (at least one week) so a new user is not told everything is under-trained.
 */
export function muscleDistribution(
  logs: readonly LogEntry[],
  exercises: readonly StatsExercise[],
  muscles: readonly StatsMuscle[],
  now?: Date,
  weeks = 4,
): MuscleDistribution {
  const count = Math.max(1, Math.floor(Number.isFinite(weeks) ? weeks : 4));
  const norm = normalizeLogs(logs);
  const today = todayNumber(now);
  const windowStart = today - count * 7 + 1;
  const byId = new Map<string, StatsExercise>();
  for (const ex of Array.isArray(exercises) ? exercises : []) {
    if (ex && typeof ex.id === 'string') byId.set(ex.id, ex);
  }
  const credit = new Map<string, number>();
  let unmatchedSets = 0;
  let firstDay = Infinity;
  for (const log of norm) {
    if (log.day > today) continue;
    if (log.day < firstDay) firstDay = log.day;
    if (log.day < windowStart) continue;
    const ex = byId.get(log.exerciseId);
    if (!ex) {
      unmatchedSets += log.sets;
      continue;
    }
    const primary = new Set(Array.isArray(ex.primaryMuscles) ? ex.primaryMuscles : []);
    for (const id of primary) credit.set(id, (credit.get(id) ?? 0) + log.sets * PRIMARY_CREDIT);
    for (const id of new Set(Array.isArray(ex.secondaryMuscles) ? ex.secondaryMuscles : [])) {
      if (primary.has(id)) continue;
      credit.set(id, (credit.get(id) ?? 0) + log.sets * SECONDARY_CREDIT);
    }
  }
  const loggedDays = Number.isFinite(firstDay) ? today - Math.max(firstDay, windowStart) + 1 : count * 7;
  const effectiveWeeks = Math.min(count, Math.max(1, loggedDays / 7));
  const list = Array.isArray(muscles) ? muscles : [];
  const total = list.reduce((sum, m) => sum + (credit.get(m.id) ?? 0), 0);
  const hasData = total > 0;
  const items: MuscleLoad[] = list.map((m) => {
    const weightedSets = credit.get(m.id) ?? 0;
    const setsPerWeek = weightedSets / effectiveWeeks;
    return {
      muscleId: m.id,
      name: m.name,
      weightedSets: round2(weightedSets),
      setsPerWeek: round2(setsPerWeek),
      share: hasData ? weightedSets / total : 0,
      undertrained: hasData && setsPerWeek < UNDERTRAINED_SETS_PER_WEEK,
    };
  });
  return {
    items,
    undertrained: items.filter((i) => i.undertrained).sort((a, b) => a.setsPerWeek - b.setsPerWeek),
    totalWeightedSets: round2(total),
    unmatchedSets: round2(unmatchedSets),
    windowStart: dateKeyOf(windowStart),
    windowEnd: dateKeyOf(today),
    effectiveWeeks: round2(effectiveWeeks),
    hasData,
  };
}

/* ------------------------------------------------------------------ */
/* Estimated 1RM and per-exercise progress                            */
/* ------------------------------------------------------------------ */

/**
 * Epley estimate: w × (1 + reps / 30). Returns null when the weight is not
 * positive or reps fall outside 1–12. A single rep is its own 1RM.
 */
export function epley1rm(weightKg: number, reps: number): number | null {
  if (!Number.isFinite(weightKg) || !Number.isFinite(reps)) return null;
  if (weightKg <= 0 || reps < 1 || reps > E1RM_MAX_REPS) return null;
  if (reps === 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

export interface ProgressSession {
  date: string;
  sets: number;
  volumeKg: number;
  topWeightKg: number;
  /** Best Epley estimate of the day; null when no set qualifies. */
  bestE1rm: number | null;
  bestSet: { weightKg: number; reps: number } | null;
  /** True when this session beat every earlier session's best e1RM. The first session is a baseline, not a PR. */
  isPr: boolean;
}

export interface RecordMark {
  value: number;
  date: string;
}

export interface ExerciseProgress {
  exerciseId: string;
  /** One entry per training day, oldest first. */
  sessions: ProgressSession[];
  bestE1rm: RecordMark | null;
  heaviest: RecordMark | null;
  bestVolume: RecordMark | null;
  prCount: number;
  latestIsPr: boolean;
}

export function exerciseProgress(logs: readonly LogEntry[], exerciseId: string): ExerciseProgress {
  const norm = normalizeLogs(logs)
    .filter((l) => l.exerciseId === exerciseId)
    .sort((a, b) => a.day - b.day);
  const sessions: ProgressSession[] = [];
  let bestE1rm: RecordMark | null = null;
  let heaviest: RecordMark | null = null;
  let bestVolume: RecordMark | null = null;
  let prCount = 0;
  let i = 0;
  while (i < norm.length) {
    const day = norm[i].day;
    const session: ProgressSession = {
      date: norm[i].date,
      sets: 0,
      volumeKg: 0,
      topWeightKg: 0,
      bestE1rm: null,
      bestSet: null,
      isPr: false,
    };
    for (; i < norm.length && norm[i].day === day; i += 1) {
      const log = norm[i];
      session.sets += log.sets;
      session.volumeKg += log.volumeKg;
      if (log.weightKg > session.topWeightKg) session.topWeightKg = log.weightKg;
      const estimate = epley1rm(log.weightKg, log.reps);
      if (estimate !== null && (session.bestE1rm === null || estimate > session.bestE1rm)) {
        session.bestE1rm = estimate;
        session.bestSet = { weightKg: log.weightKg, reps: log.reps };
      }
    }
    session.sets = round2(session.sets);
    session.volumeKg = round2(session.volumeKg);
    if (session.bestE1rm !== null) {
      session.bestE1rm = round2(session.bestE1rm);
      if (bestE1rm === null) {
        bestE1rm = { value: session.bestE1rm, date: session.date };
      } else if (session.bestE1rm > bestE1rm.value) {
        bestE1rm = { value: session.bestE1rm, date: session.date };
        session.isPr = true;
        prCount += 1;
      }
    }
    if (session.topWeightKg > 0 && (heaviest === null || session.topWeightKg > heaviest.value)) {
      heaviest = { value: session.topWeightKg, date: session.date };
    }
    if (session.volumeKg > 0 && (bestVolume === null || session.volumeKg > bestVolume.value)) {
      bestVolume = { value: session.volumeKg, date: session.date };
    }
    sessions.push(session);
  }
  return {
    exerciseId,
    sessions,
    bestE1rm,
    heaviest,
    bestVolume,
    prCount,
    latestIsPr: sessions.length > 0 && sessions[sessions.length - 1].isPr,
  };
}

export interface LoggedExercise {
  exerciseId: string;
  /** null when the exercise is no longer in the catalogue. */
  name: string | null;
  sessions: number;
  lastDate: string;
}

/** Exercises that have at least one valid log, most recently trained first. */
export function loggedExercises(logs: readonly LogEntry[], exercises: readonly StatsExercise[]): LoggedExercise[] {
  const names = new Map<string, string>();
  for (const ex of Array.isArray(exercises) ? exercises : []) {
    if (ex && typeof ex.id === 'string') names.set(ex.id, ex.name);
  }
  const seen = new Map<string, { days: Set<number>; last: number }>();
  for (const log of normalizeLogs(logs)) {
    const slot = seen.get(log.exerciseId) ?? { days: new Set<number>(), last: log.day };
    slot.days.add(log.day);
    if (log.day > slot.last) slot.last = log.day;
    seen.set(log.exerciseId, slot);
  }
  return [...seen.entries()]
    .map(([exerciseId, slot]) => ({
      exerciseId,
      name: names.get(exerciseId) ?? null,
      sessions: slot.days.size,
      lastDate: dateKeyOf(slot.last),
      last: slot.last,
    }))
    .sort((a, b) => b.last - a.last || a.exerciseId.localeCompare(b.exerciseId))
    .map(({ last: _last, ...rest }) => rest);
}
