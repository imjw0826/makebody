// Plain assertions for stats.ts — no test framework.
// Run with a TypeScript-aware runtime, for example:
//   node --experimental-strip-types src/features/insights/stats.selfcheck.ts
// It throws on the first failure and logs a one-line summary on success.
// Nothing in the app imports this file.

import {
  compareWeeks,
  dateKeyOf,
  epley1rm,
  exerciseProgress,
  heatLevel,
  loggedExercises,
  muscleDistribution,
  normalizeLogs,
  parseDateKey,
  trainingHeatmap,
  trainingStreaks,
  weekdayOf,
  weeklyVolume,
  weekStartOf,
} from './stats.ts';
import type { LogEntry, StatsExercise, StatsMuscle } from './stats.ts';

let checks = 0;

function ok(condition: boolean, label: string): void {
  checks += 1;
  if (!condition) throw new Error(`stats selfcheck failed: ${label}`);
}

function eq(actual: unknown, expected: unknown, label: string): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  ok(a === e, `${label} — expected ${e}, got ${a}`);
}

function near(actual: number | null, expected: number, label: string): void {
  ok(actual !== null && Math.abs(actual - expected) < 0.011, `${label} — expected ≈${expected}, got ${actual}`);
}

let seq = 0;
function log(exerciseId: string, date: string, sets: number, reps: number, weightKg: number): LogEntry {
  seq += 1;
  return { id: `l${seq}`, exerciseId, date, sets, reps, weightKg };
}

export function runStatsSelfCheck(): number {
  checks = 0;

  // "Today" is Sunday 2026-11-15, so the current week runs Mon 11-09 … Sun 11-15.
  const now = new Date(2026, 10, 15, 22, 30);

  /* dates */
  const today = parseDateKey('2026-11-15');
  ok(today !== null, 'valid date parses');
  eq(weekdayOf(today as number), 6, '2026-11-15 is a Sunday');
  eq(dateKeyOf(weekStartOf(today as number)), '2026-11-09', 'week starts on Monday');
  eq(dateKeyOf(weekStartOf(parseDateKey('2026-11-09') as number)), '2026-11-09', 'Monday is its own week start');
  eq(dateKeyOf(weekStartOf(parseDateKey('2026-01-01') as number)), '2025-12-29', 'week start crosses a year boundary');
  eq(dateKeyOf(parseDateKey('2026-11-15T09:00:00') as number), '2026-11-15', 'ISO time suffix is ignored');
  eq(parseDateKey('2026-02-30'), null, 'impossible day rejected');
  eq(parseDateKey('2026-13-01'), null, 'impossible month rejected');
  eq(parseDateKey('15/11/2026'), null, 'wrong format rejected');
  eq(parseDateKey(undefined), null, 'non-string rejected');
  ok(parseDateKey('2024-02-29') !== null, 'leap day accepted');

  /* normalisation */
  eq(normalizeLogs(null), [], 'null logs');
  eq(normalizeLogs('nope'), [], 'non-array logs');
  const messy: unknown[] = [
    null,
    42,
    { id: 'a', exerciseId: 'squat', date: 'bad', sets: 3, reps: 5, weightKg: 100 },
    { id: 'b', exerciseId: '', date: '2026-11-10', sets: 3, reps: 5, weightKg: 100 },
    { id: 'c', exerciseId: 'squat', date: '2026-11-10', sets: 0, reps: 5, weightKg: 100 },
    { id: 'd', exerciseId: 'squat', date: '2026-11-10', sets: 3, reps: Number.NaN, weightKg: 100 },
    { id: 'e', exerciseId: 'squat', date: '2026-11-10', sets: 3, reps: 5, weightKg: -20 },
    { id: 'f', exerciseId: 'squat', date: '2026-11-10', sets: '2', reps: '8', weightKg: '50' },
  ];
  const cleaned = normalizeLogs(messy);
  eq(cleaned.length, 2, 'only countable entries survive');
  eq(cleaned[0].weightKg, 0, 'negative weight becomes bodyweight');
  eq(cleaned[1].volumeKg, 800, 'numeric strings are coerced');

  /* empty input everywhere */
  const emptyWeek = compareWeeks([], now);
  eq(emptyWeek.thisWeek, { workoutDays: 0, totalSets: 0, volumeKg: 0 }, 'empty week totals');
  eq(emptyWeek.delta, { workoutDays: 0, totalSets: 0, volumeKg: 0 }, 'empty week delta');
  eq(trainingHeatmap([], now).weeks.length, 12, 'empty heatmap still has 12 weeks');
  eq(trainingHeatmap([], now).activeDays, 0, 'empty heatmap has no active days');
  eq(trainingStreaks([], now), { currentDays: 0, longestDays: 0, currentWeeks: 0, longestWeeks: 0, lastWorkoutDate: null }, 'empty streaks');
  eq(weeklyVolume([], now).length, 8, 'empty weekly volume has 8 buckets');
  eq(muscleDistribution([], [], [], now).hasData, false, 'empty distribution');
  eq(exerciseProgress([], 'squat').sessions, [], 'empty progress');
  eq(loggedExercises([], []), [], 'empty logged exercises');

  /* fixtures */
  const exercises: StatsExercise[] = [
    { id: 'bench', name: '벤치프레스', primaryMuscles: ['chest'], secondaryMuscles: ['triceps', 'shoulders'] },
    { id: 'squat', name: '스쿼트', primaryMuscles: ['quads', 'glutes'], secondaryMuscles: ['hamstrings', 'glutes'] },
    { id: 'pushup', name: '푸시업', primaryMuscles: ['chest'], secondaryMuscles: ['triceps'] },
  ];
  const muscles: StatsMuscle[] = [
    { id: 'chest', name: '가슴' },
    { id: 'triceps', name: '삼두근' },
    { id: 'shoulders', name: '어깨' },
    { id: 'quads', name: '대퇴사두근' },
    { id: 'glutes', name: '둔근' },
    { id: 'hamstrings', name: '햄스트링' },
    { id: 'calves', name: '종아리' },
  ];
  const logs: LogEntry[] = [
    // this week
    log('bench', '2026-11-09', 3, 10, 60), // Mon, 1800 kg
    log('squat', '2026-11-09', 4, 5, 100), // Mon, 2000 kg
    log('bench', '2026-11-14', 3, 8, 65), // Sat, 1560 kg
    log('pushup', '2026-11-15', 2, 15, 0), // Sun (today), 0 kg
    // last week
    log('bench', '2026-11-03', 3, 10, 57.5), // Tue, 1725 kg
    log('squat', '2026-11-08', 5, 5, 95), // Sun, 2375 kg
    // older
    log('bench', '2026-10-20', 3, 10, 55), // 1650 kg
    log('bench', '2026-09-01', 3, 15, 40), // too many reps for e1RM
    log('ghost', '2026-11-10', 2, 10, 20), // not in the catalogue
    // future, must not affect "now" windows
    log('bench', '2026-11-20', 3, 10, 200),
  ];

  /* weekly comparison */
  const week = compareWeeks(logs, now);
  eq(week.thisWeekStart, '2026-11-09', 'this week start');
  eq(week.lastWeekStart, '2026-11-02', 'last week start');
  eq(week.thisWeek, { workoutDays: 4, totalSets: 14, volumeKg: 5760 }, 'this week totals');
  eq(week.lastWeek, { workoutDays: 2, totalSets: 8, volumeKg: 4100 }, 'last week totals');
  eq(week.delta, { workoutDays: 2, totalSets: 6, volumeKg: 1660 }, 'week delta');
  // Sunday belongs to the week that started the previous Monday.
  eq(compareWeeks([log('squat', '2026-11-08', 1, 1, 1)], now).lastWeek.workoutDays, 1, 'Sunday counts toward last week');
  // On a Monday, yesterday is already last week.
  eq(compareWeeks(logs, new Date(2026, 10, 9)).thisWeek, { workoutDays: 1, totalSets: 7, volumeKg: 3800 }, 'Monday view');

  /* heatmap */
  const heat = trainingHeatmap(logs, now);
  eq(heat.weeks.length, 12, '12 heatmap weeks');
  eq(heat.weeks[11].weekStart, '2026-11-09', 'last heatmap column is this week');
  eq(heat.weeks[0].weekStart, '2026-08-24', 'first heatmap column is 11 weeks back');
  ok(heat.weeks.every((w) => w.days.length === 7 && w.days[0].weekday === 0), 'every column is Mon–Sun');
  eq(heat.weeks[11].days[0].sets, 7, 'Monday sets are summed');
  eq(heat.weeks[11].days[6].isToday, true, 'today is flagged');
  eq(heat.weeks[11].workoutDays, 4, 'heatmap week workout days');
  eq(heat.activeDays, 8, 'active days in 12 weeks (future excluded)');
  const midweek = trainingHeatmap(logs, new Date(2026, 10, 11));
  eq(midweek.weeks[11].days[3].isFuture, true, 'days after today are flagged as future');
  eq(midweek.weeks[11].days[5].sets, 0, 'future logs are not counted');
  eq([heatLevel(0), heatLevel(1), heatLevel(9), heatLevel(10), heatLevel(19), heatLevel(20)], [0, 1, 1, 2, 2, 3], 'heat levels');
  eq(trainingHeatmap(logs, now, 0).weeks.length, 1, 'week count is clamped to at least 1');

  /* streaks */
  const streak = trainingStreaks(logs, now);
  eq(streak.currentDays, 2, 'current day streak (Sat + Sun)');
  eq(streak.longestDays, 3, 'longest day streak (11-08 … 11-10)');
  eq(streak.currentWeeks, 2, 'current week streak');
  eq(streak.longestWeeks, 2, 'longest week streak');
  eq(streak.lastWorkoutDate, '2026-11-15', 'last workout ignores future logs');
  eq(trainingStreaks([log('squat', '2026-11-14', 1, 1, 1)], now).currentDays, 1, 'yesterday keeps the streak alive');
  eq(trainingStreaks([log('squat', '2026-11-13', 1, 1, 1)], now).currentDays, 0, 'two days ago breaks the streak');
  eq(trainingStreaks([log('squat', '2026-11-05', 1, 1, 1)], now).currentWeeks, 1, 'last week keeps the week streak alive');
  eq(trainingStreaks([log('squat', '2026-10-28', 1, 1, 1)], now).currentWeeks, 0, 'two weeks ago breaks the week streak');

  /* weekly volume */
  const volume = weeklyVolume(logs, now);
  eq(volume.length, 8, '8 volume buckets');
  eq(volume[7].isCurrent, true, 'last bucket is the current week');
  eq(volume[7].volumeKg, 5760, 'current week volume');
  eq(volume[6].volumeKg, 4100, 'last week volume');
  eq(volume[4].weekStart, '2026-10-19', 'bucket week start');
  eq(volume[4].volumeKg, 1650, 'older week volume');
  eq(volume[0].weekStart, '2026-09-21', 'oldest bucket');
  eq(volume.reduce((sum, b) => sum + b.volumeKg, 0), 11510, 'logs outside 8 weeks and future logs are excluded');

  /* muscle distribution — window 2026-10-19 … 2026-11-15 */
  const dist = muscleDistribution(logs, exercises, muscles, now);
  eq([dist.windowStart, dist.windowEnd], ['2026-10-19', '2026-11-15'], '4-week rolling window');
  eq(dist.effectiveWeeks, 4, 'full window when logging started earlier');
  const load = (id: string) => dist.items.find((m) => m.muscleId === id);
  eq(dist.items.map((m) => m.muscleId), muscles.map((m) => m.id), 'items keep the given muscle order');
  eq(load('chest')?.weightedSets, 14, 'chest: 12 bench + 2 push-up sets');
  eq(load('triceps')?.weightedSets, 7, 'triceps: half credit');
  eq(load('shoulders')?.weightedSets, 6, 'shoulders: half credit from bench only');
  eq(load('quads')?.weightedSets, 9, 'quads: primary credit');
  eq(load('glutes')?.weightedSets, 9, 'a muscle listed as primary and secondary is credited once');
  eq(load('hamstrings')?.weightedSets, 4.5, 'hamstrings: half credit');
  eq(load('calves')?.weightedSets, 0, 'untrained muscle');
  eq(load('chest')?.setsPerWeek, 3.5, 'sets per week');
  eq(dist.totalWeightedSets, 49.5, 'total weighted sets');
  eq(dist.unmatchedSets, 2, 'unknown exercise sets are reported, not credited');
  near(dist.items.reduce((sum, m) => sum + m.share, 0), 1, 'shares add up to 1');
  eq(dist.undertrained[0].muscleId, 'calves', 'least trained muscle comes first');
  ok(dist.undertrained.length === muscles.length, 'all below 4 sets/week here');
  // A new user is averaged over the time actually logged.
  const fresh = muscleDistribution([log('bench', '2026-11-14', 5, 10, 60)], exercises, muscles, now);
  eq(fresh.effectiveWeeks, 1, 'new user: at least one week as divisor');
  eq(fresh.items[0].undertrained, false, '5 chest sets in the first week is not under-trained');
  eq(fresh.items[1].undertrained, true, '2.5 triceps credits is under-trained');
  eq(muscleDistribution([log('ghost', '2026-11-14', 5, 10, 60)], exercises, muscles, now).undertrained, [], 'no hint without usable data');

  /* Epley */
  near(epley1rm(100, 5), 116.67, 'Epley 100 × 5');
  near(epley1rm(60, 12), 84, 'Epley at the 12-rep limit');
  eq(epley1rm(100, 1), 100, 'a single rep is its own 1RM');
  eq(epley1rm(100, 13), null, 'more than 12 reps is not estimated');
  eq(epley1rm(0, 5), null, 'zero weight is not estimated');
  eq(epley1rm(-5, 5), null, 'negative weight is not estimated');
  eq(epley1rm(Number.NaN, 5), null, 'NaN weight is not estimated');
  eq(epley1rm(100, 0), null, 'zero reps is not estimated');

  /* per-exercise progress */
  const bench = exerciseProgress(logs, 'bench');
  eq(bench.sessions.map((s) => s.date), ['2026-09-01', '2026-10-20', '2026-11-03', '2026-11-09', '2026-11-14', '2026-11-20'], 'sessions oldest first');
  eq(bench.sessions[0].bestE1rm, null, '15-rep session has no e1RM');
  near(bench.sessions[1].bestE1rm, 73.33, 'e1RM 55 × 10');
  eq(bench.sessions.map((s) => s.isPr), [false, false, true, true, true, true], 'first estimate is a baseline, later bests are PRs');
  eq(bench.prCount, 4, 'PR count');
  eq(bench.latestIsPr, true, 'latest session is a PR');
  near(bench.bestE1rm?.value ?? null, 266.67, 'best e1RM');
  eq(bench.heaviest, { value: 200, date: '2026-11-20' }, 'heaviest weight');
  eq(bench.bestVolume, { value: 6000, date: '2026-11-20' }, 'best session volume');
  const sameDay = exerciseProgress([log('squat', '2026-11-01', 1, 3, 100), log('squat', '2026-11-01', 2, 8, 90), log('squat', '2026-11-05', 3, 5, 90)], 'squat');
  eq(sameDay.sessions.length, 2, 'logs on one day form one session');
  eq(sameDay.sessions[0].bestSet, { weightKg: 90, reps: 8 }, 'best set of the day by e1RM');
  eq(sameDay.sessions[0].topWeightKg, 100, 'top weight of the day');
  eq(sameDay.sessions[0].volumeKg, 1740, 'session volume');
  eq(sameDay.sessions[1].isPr, false, 'a lower estimate is not a PR');
  eq(sameDay.prCount, 0, 'no PRs');
  const bodyweight = exerciseProgress(logs, 'pushup');
  eq([bodyweight.bestE1rm, bodyweight.heaviest, bodyweight.bestVolume], [null, null, null], 'bodyweight exercise has no records');

  /* exercise picker */
  const picker = loggedExercises(logs, exercises);
  eq(picker.map((p) => p.exerciseId), ['bench', 'pushup', 'ghost', 'squat'], 'most recently trained first');
  eq(picker[0].sessions, 6, 'session count per exercise');
  eq(picker[2].name, null, 'unknown exercise has no name');

  return checks;
}

console.log(`stats selfcheck: ${runStatsSelfCheck()} assertions passed`);
