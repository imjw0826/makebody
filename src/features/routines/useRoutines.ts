import { useSyncExternalStore } from 'react';
import type { Exercise, MovementId } from '../../data/exercises';
import { clampNumber, createId, createPersistentStore, isRecord } from './storage';
import type { Routine, RoutineItem } from './types';

export const ROUTINES_STORAGE_KEY = 'form.routines.v1';
const VERSION = 1;

export const LIMITS = {
  sets: { min: 1, max: 20 },
  reps: { min: 1, max: 200 },
  weightKg: { min: 0, max: 999 },
  restSec: { min: 0, max: 600 },
  name: 40,
} as const;

const LONG_REST: ReadonlySet<MovementId> = new Set<MovementId>(['squat', 'hinge', 'press', 'row', 'pulldown', 'lunge']);

const roundWeight = (kg: number) => Math.round(kg * 100) / 100;

function sanitizeItem(raw: unknown): RoutineItem | null {
  if (!isRecord(raw) || typeof raw.exerciseId !== 'string' || raw.exerciseId === '') return null;
  const item: RoutineItem = {
    exerciseId: raw.exerciseId,
    sets: Math.round(clampNumber(raw.sets, LIMITS.sets.min, LIMITS.sets.max, 3)),
    reps: Math.round(clampNumber(raw.reps, LIMITS.reps.min, LIMITS.reps.max, 10)),
    restSec: Math.round(clampNumber(raw.restSec, LIMITS.restSec.min, LIMITS.restSec.max, 60)),
  };
  if (raw.weightKg !== undefined && raw.weightKg !== null && raw.weightKg !== '') {
    const kg = clampNumber(raw.weightKg, LIMITS.weightKg.min, LIMITS.weightKg.max, NaN);
    if (Number.isFinite(kg)) item.weightKg = roundWeight(kg);
  }
  return item;
}

function sanitizeItems(raw: unknown): RoutineItem[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const items: RoutineItem[] = [];
  for (const entry of raw) {
    const item = sanitizeItem(entry);
    if (!item || seen.has(item.exerciseId)) continue;
    seen.add(item.exerciseId);
    items.push(item);
  }
  return items;
}

function sanitizeRoutine(raw: unknown): Routine | null {
  if (!isRecord(raw) || typeof raw.id !== 'string' || raw.id === '') return null;
  const name = typeof raw.name === 'string' ? raw.name.trim().slice(0, LIMITS.name) : '';
  const createdAt =
    typeof raw.createdAt === 'string' && !Number.isNaN(Date.parse(raw.createdAt)) ? raw.createdAt : new Date().toISOString();
  return { id: raw.id, name: name || '이름 없는 루틴', createdAt, items: sanitizeItems(raw.items) };
}

/** 저장 형식: { version: 1, routines: Routine[] }. 예전처럼 배열만 저장된 값도 읽습니다. */
function decodeRoutines(raw: unknown): Routine[] {
  const list = Array.isArray(raw) ? raw : isRecord(raw) && Array.isArray(raw.routines) ? raw.routines : [];
  const seen = new Set<string>();
  const routines: Routine[] = [];
  for (const entry of list) {
    const routine = sanitizeRoutine(entry);
    if (!routine || seen.has(routine.id)) continue;
    seen.add(routine.id);
    routines.push(routine);
  }
  return routines;
}

const store = createPersistentStore<Routine[]>(ROUTINES_STORAGE_KEY, decodeRoutines, (routines) => ({
  version: VERSION,
  routines,
}));

function mutate(routineId: string, change: (routine: Routine) => Routine) {
  const current = store.get();
  if (!current.some((routine) => routine.id === routineId)) return;
  store.set(current.map((routine) => (routine.id === routineId ? change(routine) : routine)));
}

function uniqueName(base: string): string {
  const names = new Set(store.get().map((routine) => routine.name));
  if (!names.has(base)) return base;
  for (let n = 2; n < 1000; n += 1) {
    const candidate = `${base.slice(0, LIMITS.name - 4)} ${n}`;
    if (!names.has(candidate)) return candidate;
  }
  return base;
}

/** 운동의 기본 세트·횟수로 루틴 항목을 만듭니다. 다관절 동작은 휴식 90초, 그 외 60초. */
export function itemFromExercise(exercise: Pick<Exercise, 'id' | 'defaultSets' | 'defaultReps' | 'movement'>): RoutineItem {
  return {
    exerciseId: exercise.id,
    sets: Math.round(clampNumber(exercise.defaultSets, LIMITS.sets.min, LIMITS.sets.max, 3)),
    reps: Math.round(clampNumber(exercise.defaultReps, LIMITS.reps.min, LIMITS.reps.max, 10)),
    restSec: LONG_REST.has(exercise.movement) ? 90 : 60,
  };
}

function createRoutine(name?: string, items?: RoutineItem[]): Routine {
  const trimmed = name?.trim().slice(0, LIMITS.name);
  const routine: Routine = {
    id: createId(),
    name: uniqueName(trimmed || '새 루틴'),
    createdAt: new Date().toISOString(),
    items: sanitizeItems(items ?? []),
  };
  store.set([...store.get(), routine]);
  return routine;
}

function renameRoutine(routineId: string, name: string): void {
  const trimmed = name.trim().slice(0, LIMITS.name);
  if (!trimmed) return;
  mutate(routineId, (routine) => ({ ...routine, name: trimmed }));
}

function duplicateRoutine(routineId: string): Routine | undefined {
  const current = store.get();
  const index = current.findIndex((routine) => routine.id === routineId);
  if (index < 0) return undefined;
  const source = current[index];
  const copy: Routine = {
    id: createId(),
    name: uniqueName(`${source.name.slice(0, LIMITS.name - 4)} 복사본`),
    createdAt: new Date().toISOString(),
    items: source.items.map((item) => ({ ...item })),
  };
  store.set([...current.slice(0, index + 1), copy, ...current.slice(index + 1)]);
  return copy;
}

function deleteRoutine(routineId: string): void {
  const current = store.get();
  if (current.some((routine) => routine.id === routineId)) store.set(current.filter((routine) => routine.id !== routineId));
}

/** 같은 운동이 이미 있으면 아무 일도 하지 않습니다(루틴 안에서 운동은 한 번씩만). */
function addItem(routineId: string, item: RoutineItem): void {
  const clean = sanitizeItem(item);
  if (!clean) return;
  mutate(routineId, (routine) =>
    routine.items.some((existing) => existing.exerciseId === clean.exerciseId)
      ? routine
      : { ...routine, items: [...routine.items, clean] },
  );
}

function removeItem(routineId: string, exerciseId: string): void {
  mutate(routineId, (routine) => ({ ...routine, items: routine.items.filter((item) => item.exerciseId !== exerciseId) }));
}

function moveItem(routineId: string, exerciseId: string, direction: 'up' | 'down'): void {
  mutate(routineId, (routine) => {
    const from = routine.items.findIndex((item) => item.exerciseId === exerciseId);
    const to = direction === 'up' ? from - 1 : from + 1;
    if (from < 0 || to < 0 || to >= routine.items.length) return routine;
    const items = [...routine.items];
    [items[from], items[to]] = [items[to], items[from]];
    return { ...routine, items };
  });
}

/** weightKg에 undefined를 넘기면 무게를 비웁니다. */
function updateItem(routineId: string, exerciseId: string, patch: Partial<Omit<RoutineItem, 'exerciseId'>>): void {
  mutate(routineId, (routine) => ({
    ...routine,
    items: routine.items.map((item) => {
      if (item.exerciseId !== exerciseId) return item;
      const merged: Record<string, unknown> = { ...item, ...patch };
      return sanitizeItem(merged) ?? item;
    }),
  }));
}

export interface UseRoutinesResult {
  routines: Routine[];
  /** 브라우저 저장에 실패했으면 true (새로고침하면 변경이 사라질 수 있음) */
  storageError: boolean;
  createRoutine: (name?: string, items?: RoutineItem[]) => Routine;
  renameRoutine: (routineId: string, name: string) => void;
  duplicateRoutine: (routineId: string) => Routine | undefined;
  deleteRoutine: (routineId: string) => void;
  addItem: (routineId: string, item: RoutineItem) => void;
  removeItem: (routineId: string, exerciseId: string) => void;
  moveItem: (routineId: string, exerciseId: string, direction: 'up' | 'down') => void;
  updateItem: (routineId: string, exerciseId: string, patch: Partial<Omit<RoutineItem, 'exerciseId'>>) => void;
}

/**
 * localStorage 'form.routines.v1'에 저장되는 루틴 목록.
 * 여러 컴포넌트에서 불러도 같은 목록을 공유하고, 액션 함수의 참조는 변하지 않습니다.
 */
export function useRoutines(): UseRoutinesResult {
  const routines = useSyncExternalStore(store.subscribe, store.get, store.get);
  return {
    routines,
    storageError: store.hasError(),
    createRoutine,
    renameRoutine,
    duplicateRoutine,
    deleteRoutine,
    addItem,
    removeItem,
    moveItem,
    updateItem,
  };
}
