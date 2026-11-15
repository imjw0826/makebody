import { useSyncExternalStore } from 'react';
import type { Exercise } from '../../data/exercises';
import { clampNumber, createPersistentStore, isRecord } from './storage';
import type { Routine, WorkoutSummary } from './types';
import { LIMITS } from './useRoutines';

export const SESSION_STORAGE_KEY = 'form.session.v1';
const VERSION = 1;
export const REST_EXTENSION_MS = 15_000;

export interface SessionSet {
  reps: number;
  weightKg: number;
  done: boolean;
}

export interface SessionItem {
  exerciseId: string;
  restSec: number;
  sets: SessionSet[];
}

export interface RestState {
  /** 휴식이 끝나는 시각(epoch ms). 일시정지 중에는 쓰지 않습니다. */
  endsAt: number;
  totalMs: number;
  /** 일시정지 중이면 남은 시간, 아니면 null */
  pausedRemainingMs: number | null;
  /** 휴식이 끝나면 넘어갈 운동 순번 */
  advanceTo: number | null;
}

export interface SessionState {
  version: 1;
  routineId: string;
  routineName: string;
  /** ISO 8601 */
  startedAt: string;
  /** resumedAt 이전까지 쌓인 진행 시간 */
  elapsedMs: number;
  /** 지금 화면이 열린 뒤 마지막으로 시간을 정산한 시각(epoch ms) */
  resumedAt: number;
  currentIndex: number;
  items: SessionItem[];
  rest: RestState | null;
  /** ISO 8601, 끝났으면 채워집니다. */
  finishedAt: string | null;
}

function decodeSet(raw: unknown): SessionSet | null {
  if (!isRecord(raw)) return null;
  return {
    reps: Math.round(clampNumber(raw.reps, LIMITS.reps.min, LIMITS.reps.max, 10)),
    weightKg: clampNumber(raw.weightKg, LIMITS.weightKg.min, LIMITS.weightKg.max, 0),
    done: raw.done === true,
  };
}

function decodeItem(raw: unknown): SessionItem | null {
  if (!isRecord(raw) || typeof raw.exerciseId !== 'string' || !Array.isArray(raw.sets)) return null;
  const sets = raw.sets.map(decodeSet).filter((set): set is SessionSet => set !== null).slice(0, LIMITS.sets.max);
  if (sets.length === 0) return null;
  return {
    exerciseId: raw.exerciseId,
    restSec: Math.round(clampNumber(raw.restSec, LIMITS.restSec.min, LIMITS.restSec.max, 60)),
    sets,
  };
}

function decodeRest(raw: unknown, itemCount: number): RestState | null {
  if (!isRecord(raw) || typeof raw.endsAt !== 'number' || !Number.isFinite(raw.endsAt)) return null;
  const paused = typeof raw.pausedRemainingMs === 'number' && raw.pausedRemainingMs >= 0 ? raw.pausedRemainingMs : null;
  const advance =
    typeof raw.advanceTo === 'number' && Number.isInteger(raw.advanceTo) && raw.advanceTo >= 0 && raw.advanceTo < itemCount
      ? raw.advanceTo
      : null;
  return {
    endsAt: raw.endsAt,
    totalMs: Math.max(1000, clampNumber(raw.totalMs, 0, 3_600_000, 60_000)),
    pausedRemainingMs: paused,
    advanceTo: advance,
  };
}

/** 조금이라도 이상하면 null(저장된 세션 없음)로 취급합니다. */
function decodeSession(raw: unknown): SessionState | null {
  if (!isRecord(raw) || raw.version !== VERSION) return null;
  if (typeof raw.routineId !== 'string' || typeof raw.startedAt !== 'string' || !Array.isArray(raw.items)) return null;
  if (Number.isNaN(Date.parse(raw.startedAt))) return null;
  const items = raw.items.map(decodeItem).filter((item): item is SessionItem => item !== null);
  if (items.length === 0 || items.length !== raw.items.length) return null;
  const finishedAt = typeof raw.finishedAt === 'string' && !Number.isNaN(Date.parse(raw.finishedAt)) ? raw.finishedAt : null;
  return {
    version: VERSION,
    routineId: raw.routineId,
    routineName: typeof raw.routineName === 'string' && raw.routineName ? raw.routineName : '루틴',
    startedAt: raw.startedAt,
    elapsedMs: clampNumber(raw.elapsedMs, 0, Number.MAX_SAFE_INTEGER, 0),
    resumedAt: clampNumber(raw.resumedAt, 0, Number.MAX_SAFE_INTEGER, Date.now()),
    currentIndex: Math.round(clampNumber(raw.currentIndex, 0, items.length - 1, 0)),
    items,
    rest: finishedAt ? null : decodeRest(raw.rest, items.length),
    finishedAt,
  };
}

export const sessionStore = createPersistentStore<SessionState | null>(SESSION_STORAGE_KEY, decodeSession, (state) =>
  state === null ? undefined : state,
);

export const clearSavedSession = (): void => sessionStore.set(null);

/* ---------- 순수 상태 전이 ---------- */

/** 루틴에서 새 세션을 만듭니다. knownIds에 없는 운동은 건너뛰고, 남는 게 없으면 null. */
export function createSession(routine: Routine, knownIds: ReadonlySet<string>, now: number): SessionState | null {
  const items: SessionItem[] = routine.items
    .filter((item) => knownIds.has(item.exerciseId))
    .map((item) => ({
      exerciseId: item.exerciseId,
      restSec: item.restSec,
      sets: Array.from({ length: Math.max(1, item.sets) }, () => ({
        reps: item.reps,
        weightKg: item.weightKg ?? 0,
        done: false,
      })),
    }));
  if (items.length === 0) return null;
  return {
    version: VERSION,
    routineId: routine.id,
    routineName: routine.name,
    startedAt: new Date(now).toISOString(),
    elapsedMs: 0,
    resumedAt: now,
    currentIndex: 0,
    items,
    rest: null,
    finishedAt: null,
  };
}

/** 화면을 다시 열었을 때: 닫혀 있던 동안은 진행 시간에 넣지 않습니다. */
export const resumeSession = (state: SessionState, now: number): SessionState => ({ ...state, resumedAt: now });

/** 지금까지 흐른 시간을 elapsedMs에 정산합니다. */
export function settleTime(state: SessionState, now: number): SessionState {
  if (state.finishedAt) return state;
  return { ...state, elapsedMs: state.elapsedMs + Math.max(0, now - state.resumedAt), resumedAt: now };
}

export const elapsedMsAt = (state: SessionState, now: number): number =>
  state.finishedAt ? state.elapsedMs : state.elapsedMs + Math.max(0, now - state.resumedAt);

export const restRemainingMs = (rest: RestState, now: number): number =>
  rest.pausedRemainingMs ?? Math.max(0, rest.endsAt - now);

const isItemDone = (item: SessionItem) => item.sets.every((set) => set.done);

function nextIncomplete(items: SessionItem[], from: number): number | null {
  for (let step = 1; step <= items.length; step += 1) {
    const index = (from + step) % items.length;
    if (!isItemDone(items[index])) return index;
  }
  return null;
}

export function finishSession(state: SessionState, now: number): SessionState {
  if (state.finishedAt) return state;
  const settled = settleTime(state, now);
  return { ...settled, rest: null, finishedAt: new Date(now).toISOString() };
}

/** 세트를 완료 처리합니다. 마지막 세트면 세션을 끝내고, 아니면 휴식을 시작합니다. */
export function completeSet(state: SessionState, itemIndex: number, setIndex: number, now: number): SessionState {
  const target = state.items[itemIndex]?.sets[setIndex];
  if (state.finishedAt || !target || target.done) return state;
  const settled = settleTime(state, now);
  const items = settled.items.map((item, i) =>
    i === itemIndex ? { ...item, sets: item.sets.map((set, j) => (j === setIndex ? { ...set, done: true } : set)) } : item,
  );
  if (items.every(isItemDone)) return finishSession({ ...settled, items }, now);
  const item = items[itemIndex];
  const advanceTo = isItemDone(item) ? nextIncomplete(items, itemIndex) : null;
  const restMs = item.restSec * 1000;
  if (restMs <= 0) return { ...settled, items, rest: null, currentIndex: advanceTo ?? itemIndex };
  return {
    ...settled,
    items,
    currentIndex: itemIndex,
    rest: { endsAt: now + restMs, totalMs: restMs, pausedRemainingMs: null, advanceTo },
  };
}

/** 휴식 종료(시간이 다 됐거나 건너뛰기). 예정된 다음 운동이 있으면 그리로 넘어갑니다. */
export function endRest(state: SessionState, now: number): SessionState {
  if (!state.rest) return state;
  const settled = settleTime(state, now);
  return { ...settled, rest: null, currentIndex: state.rest.advanceTo ?? state.currentIndex };
}

export function toggleRestPause(state: SessionState, now: number): SessionState {
  const rest = state.rest;
  if (!rest) return state;
  const settled = settleTime(state, now);
  if (rest.pausedRemainingMs === null) {
    return { ...settled, rest: { ...rest, pausedRemainingMs: Math.max(0, rest.endsAt - now) } };
  }
  return { ...settled, rest: { ...rest, endsAt: now + rest.pausedRemainingMs, pausedRemainingMs: null } };
}

export function extendRest(state: SessionState, now: number, extraMs: number = REST_EXTENSION_MS): SessionState {
  const rest = state.rest;
  if (!rest) return state;
  const settled = settleTime(state, now);
  const next: RestState =
    rest.pausedRemainingMs === null
      ? { ...rest, endsAt: Math.max(rest.endsAt, now) + extraMs }
      : { ...rest, pausedRemainingMs: rest.pausedRemainingMs + extraMs };
  return { ...settled, rest: { ...next, totalMs: Math.max(next.totalMs, restRemainingMs(next, now)) } };
}

/** 직접 다른 운동으로 이동. 휴식 타이머는 그대로 두되, 자동 이동은 취소합니다. */
export function goToExercise(state: SessionState, index: number, now: number): SessionState {
  if (index < 0 || index >= state.items.length) return state;
  const settled = settleTime(state, now);
  return { ...settled, currentIndex: index, rest: settled.rest ? { ...settled.rest, advanceTo: null } : null };
}

/** 아직 안 한 세트의 값을 바꿉니다. 같은 운동의 뒤쪽 미완료 세트에도 똑같이 반영합니다. */
export function updateSet(
  state: SessionState,
  itemIndex: number,
  setIndex: number,
  patch: Partial<Pick<SessionSet, 'reps' | 'weightKg'>>,
): SessionState {
  const target = state.items[itemIndex]?.sets[setIndex];
  if (!target || target.done) return state;
  return {
    ...state,
    items: state.items.map((item, i) =>
      i === itemIndex
        ? { ...item, sets: item.sets.map((set, j) => (j >= setIndex && !set.done ? { ...set, ...patch } : set)) }
        : item,
    ),
  };
}

export function addSet(state: SessionState, itemIndex: number): SessionState {
  const item = state.items[itemIndex];
  if (!item || item.sets.length >= LIMITS.sets.max) return state;
  const last = item.sets[item.sets.length - 1];
  const sets = [...item.sets, { reps: last.reps, weightKg: last.weightKg, done: false }];
  return { ...state, items: state.items.map((entry, i) => (i === itemIndex ? { ...entry, sets } : entry)) };
}

/** 마지막 세트가 아직 미완료일 때만 뺍니다. */
export function removeLastSet(state: SessionState, itemIndex: number): SessionState {
  const item = state.items[itemIndex];
  if (!item || item.sets.length <= 1 || item.sets[item.sets.length - 1].done) return state;
  const sets = item.sets.slice(0, -1);
  return { ...state, items: state.items.map((entry, i) => (i === itemIndex ? { ...entry, sets } : entry)) };
}

/* ---------- 파생 값 ---------- */

export function countSets(state: SessionState): { done: number; total: number } {
  let done = 0;
  let total = 0;
  for (const item of state.items) {
    total += item.sets.length;
    done += item.sets.filter((set) => set.done).length;
  }
  return { done, total };
}

export function buildSummary(state: SessionState, exerciseMap: ReadonlyMap<string, Exercise>): WorkoutSummary {
  const exercises = state.items.map((item) => {
    const done = item.sets.filter((set) => set.done);
    return {
      exerciseId: item.exerciseId,
      name: exerciseMap.get(item.exerciseId)?.name ?? item.exerciseId,
      sets: done.length,
      reps: done.reduce((sum, set) => sum + set.reps, 0),
      volumeKg: Math.round(done.reduce((sum, set) => sum + set.reps * set.weightKg, 0) * 100) / 100,
    };
  });
  const { total } = countSets(state);
  return {
    routineId: state.routineId,
    routineName: state.routineName,
    startedAt: state.startedAt,
    finishedAt: state.finishedAt ?? new Date().toISOString(),
    durationSec: Math.round(state.elapsedMs / 1000),
    totalSets: exercises.reduce((sum, entry) => sum + entry.sets, 0),
    plannedSets: total,
    totalReps: exercises.reduce((sum, entry) => sum + entry.reps, 0),
    volumeKg: Math.round(exercises.reduce((sum, entry) => sum + entry.volumeKg, 0) * 100) / 100,
    exercises,
  };
}

/** 저장된 세션을 이어 하려고 할 때, 원래 루틴이 지워졌어도 쓸 수 있는 루틴 형태로 되돌립니다. */
export function routineFromSession(state: SessionState): Routine {
  return {
    id: state.routineId,
    name: state.routineName,
    createdAt: state.startedAt,
    items: state.items.map((item) => ({
      exerciseId: item.exerciseId,
      sets: item.sets.length,
      reps: item.sets[0].reps,
      weightKg: item.sets[0].weightKg || undefined,
      restSec: item.restSec,
    })),
  };
}

export interface SavedSessionInfo {
  routineId: string;
  routineName: string;
  startedAt: string;
  doneSets: number;
  totalSets: number;
  /** 이어 하기용 루틴(원본이 지워졌을 때 사용) */
  routine: Routine;
}

let lastState: SessionState | null = null;
let lastInfo: SavedSessionInfo | null = null;

function getSavedInfo(): SavedSessionInfo | null {
  const state = sessionStore.get();
  if (state === lastState) return lastInfo;
  lastState = state;
  if (!state || state.finishedAt) {
    lastInfo = null;
  } else {
    const { done, total } = countSets(state);
    lastInfo = {
      routineId: state.routineId,
      routineName: state.routineName,
      startedAt: state.startedAt,
      doneSets: done,
      totalSets: total,
      routine: routineFromSession(state),
    };
  }
  return lastInfo;
}

/** 끝내지 않고 남겨 둔 세션이 있으면 그 요약을, 없으면 null을 돌려줍니다. */
export function useSavedSession(): SavedSessionInfo | null {
  return useSyncExternalStore(sessionStore.subscribe, getSavedInfo, getSavedInfo);
}
