import type { ReactNode } from 'react';
import type { Exercise } from '../../data/exercises';

export interface RoutineItem {
  exerciseId: string;
  sets: number;
  reps: number;
  /** 비워 두면 맨몸(0kg)으로 취급합니다. */
  weightKg?: number;
  restSec: number;
}

export interface Routine {
  id: string;
  name: string;
  /** ISO 8601 */
  createdAt: string;
  items: RoutineItem[];
}

/** 세트를 완료할 때마다 한 번씩 전달됩니다. */
export interface LogSetEntry {
  exerciseId: string;
  /** 기기 현지 날짜, YYYY-MM-DD */
  date: string;
  /** 해당 운동 안에서 0부터 시작하는 세트 순번 */
  setIndex: number;
  reps: number;
  weightKg: number;
}

export interface WorkoutSummaryExercise {
  exerciseId: string;
  name: string;
  sets: number;
  reps: number;
  volumeKg: number;
}

export interface WorkoutSummary {
  routineId: string;
  routineName: string;
  /** ISO 8601 */
  startedAt: string;
  /** ISO 8601 */
  finishedAt: string;
  /** 화면을 닫아 둔 시간은 뺀 실제 진행 시간(초) */
  durationSec: number;
  /** 완료한 세트 수 */
  totalSets: number;
  /** 계획했던 세트 수 */
  plannedSets: number;
  totalReps: number;
  /** 완료한 세트의 횟수 × 무게 합계 */
  volumeKg: number;
  exercises: WorkoutSummaryExercise[];
}

export interface WorkoutSessionProps {
  routine: Routine;
  exercises: Exercise[];
  renderAnimation?: (exercise: Exercise) => ReactNode;
  onLogSet?: (entry: LogSetEntry) => void;
  onFinish?: (summary: WorkoutSummary) => void;
  onExit?: () => void;
}

export interface RoutineBuilderProps {
  exercises: Exercise[];
  onSelectExercise?: (id: string) => void;
  /**
   * 넘기면 '운동 시작'을 눌렀을 때 이 콜백만 호출합니다(직접 WorkoutSession을 띄우는 경우).
   * 넘기지 않으면 RoutineBuilder가 자기 자리에서 WorkoutSession을 엽니다.
   */
  onStartRoutine?: (routine: Routine) => void;
  /** 아래 세 개는 내장 WorkoutSession으로 그대로 전달됩니다. */
  renderAnimation?: (exercise: Exercise) => ReactNode;
  onLogSet?: (entry: LogSetEntry) => void;
  onFinish?: (summary: WorkoutSummary) => void;
  className?: string;
}
