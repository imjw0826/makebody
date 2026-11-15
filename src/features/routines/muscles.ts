import type { Exercise, MuscleId } from '../../data/exercises';
import type { RoutineItem } from './types';

export const MUSCLE_ORDER: MuscleId[] = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'abs',
  'quads',
  'hamstrings',
  'glutes',
  'calves',
];

export const MUSCLE_LABEL: Record<MuscleId, string> = {
  chest: '가슴',
  back: '등',
  shoulders: '어깨',
  biceps: '이두근',
  triceps: '삼두근',
  abs: '복근',
  quads: '대퇴사두근',
  hamstrings: '햄스트링',
  glutes: '둔근',
  calves: '종아리',
};

export const muscleNames = (ids: MuscleId[]): string => ids.map((id) => MUSCLE_LABEL[id] ?? id).join(' · ');

export interface MuscleCoverage {
  id: MuscleId;
  name: string;
  /** 이 근육이 주동근인 운동 수 */
  primary: number;
  /** 이 근육이 보조근인 운동 수 */
  secondary: number;
}

export interface RoutineStats {
  exerciseCount: number;
  totalSets: number;
  /** 세트당 약 40초 + 휴식으로 어림한 분 단위 시간 */
  estimatedMinutes: number;
  coverage: MuscleCoverage[];
}

export function getRoutineStats(items: RoutineItem[], exerciseMap: ReadonlyMap<string, Exercise>): RoutineStats {
  const primary = new Map<MuscleId, number>();
  const secondary = new Map<MuscleId, number>();
  let totalSets = 0;
  let seconds = 0;
  for (const item of items) {
    totalSets += item.sets;
    seconds += item.sets * (40 + item.restSec);
    const exercise = exerciseMap.get(item.exerciseId);
    if (!exercise) continue;
    for (const id of exercise.primaryMuscles) primary.set(id, (primary.get(id) ?? 0) + 1);
    for (const id of exercise.secondaryMuscles) secondary.set(id, (secondary.get(id) ?? 0) + 1);
  }
  const coverage = MUSCLE_ORDER.map((id) => ({
    id,
    name: MUSCLE_LABEL[id],
    primary: primary.get(id) ?? 0,
    secondary: secondary.get(id) ?? 0,
  }))
    .filter((entry) => entry.primary + entry.secondary > 0)
    .sort((a, b) => b.primary - a.primary || b.secondary - a.secondary);
  return { exerciseCount: items.length, totalSets, estimatedMinutes: Math.round(seconds / 60), coverage };
}
