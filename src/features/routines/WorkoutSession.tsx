import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { Exercise } from '../../data/exercises';
import { muscleNames } from './muscles';
import {
  addSet,
  buildSummary,
  clearSavedSession,
  completeSet,
  countSets,
  createSession,
  elapsedMsAt,
  endRest,
  extendRest,
  finishSession,
  goToExercise,
  removeLastSet,
  restRemainingMs,
  resumeSession,
  sessionStore,
  settleTime,
  toggleRestPause,
  updateSet,
} from './session';
import type { SessionState } from './session';
import type { WorkoutSessionProps, WorkoutSummary } from './types';
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, NumberField, PauseIcon, PlayIcon, PlusIcon, SkipIcon } from './ui';
import { LIMITS } from './useRoutines';
import './routines.css';

const pad = (n: number) => String(n).padStart(2, '0');

function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}시간 ${m}분`;
  if (m > 0) return `${m}분 ${s}초`;
  return `${s}초`;
}

function localDate(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const formatKg = (kg: number) => kg.toLocaleString('ko-KR', { maximumFractionDigits: 1 });

export function WorkoutSession({ routine, exercises, renderAnimation, onLogSet, onFinish, onExit }: WorkoutSessionProps) {
  const stored = useSyncExternalStore(sessionStore.subscribe, sessionStore.get, sessionStore.get);
  const exerciseMap = useMemo(() => new Map(exercises.map((exercise) => [exercise.id, exercise])), [exercises]);
  const [now, setNow] = useState(() => Date.now());
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [announce, setAnnounce] = useState('');
  const summaryRef = useRef<HTMLHeadingElement>(null);

  const hasKnownExercise = routine.items.some((item) => exerciseMap.has(item.exerciseId));
  const session = stored && stored.routineId === routine.id ? stored : null;
  const finished = Boolean(session?.finishedAt);

  // 같은 루틴의 끝나지 않은 세션이 저장돼 있으면 이어서, 아니면 새로 시작합니다.
  useEffect(() => {
    const t = Date.now();
    const saved = sessionStore.get();
    if (saved && saved.routineId === routine.id && !saved.finishedAt) {
      sessionStore.set(resumeSession(saved, t));
    } else {
      sessionStore.set(createSession(routine, new Set(exercises.map((exercise) => exercise.id)), t));
    }
    setNow(t);
    // 루틴이 바뀔 때만 다시 시작합니다. 진행 중에 루틴·운동 목록 참조가 바뀌어도 세션은 유지합니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routine.id]);

  // 시계와 휴식 타이머. 휴식 종료 시각은 저장돼 있으므로 새로고침해도 이어집니다.
  useEffect(() => {
    const timer = window.setInterval(() => {
      const t = Date.now();
      setNow(t);
      const current = sessionStore.get();
      if (!current || current.finishedAt || !current.rest) return;
      if (current.rest.pausedRemainingMs === null && t >= current.rest.endsAt) {
        sessionStore.set(endRest(current, t));
        setAnnounce('휴식이 끝났어요. 다음 세트를 시작하세요.');
        try {
          navigator.vibrate?.(200);
        } catch {
          /* 진동 미지원 */
        }
      }
    }, 250);
    return () => window.clearInterval(timer);
  }, []);

  // 화면을 떠날 때 진행 시간을 저장해 둡니다.
  useEffect(() => {
    const settle = () => {
      const current = sessionStore.get();
      if (current && !current.finishedAt) sessionStore.set(settleTime(current, Date.now()));
    };
    // 화면만 잠깐 가린 시간(세트 사이에 휴대폰을 잠그는 경우 등)은 운동 시간에 포함합니다.
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') settle();
    };
    window.addEventListener('pagehide', settle);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', settle);
      document.removeEventListener('visibilitychange', onVisibility);
      settle();
    };
  }, []);

  useEffect(() => {
    if (finished) summaryRef.current?.focus();
  }, [finished]);

  const apply = (change: (state: SessionState, t: number) => SessionState): SessionState | null => {
    const current = sessionStore.get();
    if (!current || current.finishedAt || current.routineId !== routine.id) return null;
    const next = change(current, Date.now());
    if (next !== current) sessionStore.set(next);
    return next;
  };

  const handleComplete = (itemIndex: number, setIndex: number) => {
    const current = sessionStore.get();
    const item = current?.items[itemIndex];
    const set = item?.sets[setIndex];
    if (!current || current.finishedAt || !item || !set || set.done) return;
    const t = Date.now();
    const next = completeSet(current, itemIndex, setIndex, t);
    sessionStore.set(next);
    setConfirmFinish(false);
    onLogSet?.({ exerciseId: item.exerciseId, date: localDate(t), setIndex, reps: set.reps, weightKg: set.weightKg });
    if (next.finishedAt) {
      onFinish?.(buildSummary(next, exerciseMap));
    } else if (next.rest) {
      setAnnounce(`${setIndex + 1}세트 완료. 휴식 ${item.restSec}초를 시작합니다.`);
    } else {
      setAnnounce(`${setIndex + 1}세트 완료.`);
    }
  };

  const handleFinish = () => {
    const next = apply((state, t) => finishSession(state, t));
    setConfirmFinish(false);
    if (next?.finishedAt) onFinish?.(buildSummary(next, exerciseMap));
  };

  const handleExit = () => {
    apply((state, t) => settleTime(state, t));
    onExit?.();
  };

  const handleClose = () => {
    clearSavedSession();
    onExit?.();
  };

  if (!hasKnownExercise && !session) {
    return (
      <section className="rt-root rt-session" aria-label="운동 진행">
        <div className="rt-empty">
          <h2 className="rt-empty__title">시작할 운동이 없어요</h2>
          <p className="rt-empty__text">이 루틴에 운동을 한 개 이상 추가한 다음 다시 시작해 주세요.</p>
          {onExit && (
            <button type="button" className="rt-btn" onClick={onExit}>
              루틴으로 돌아가기
            </button>
          )}
        </div>
      </section>
    );
  }

  if (!session) return null;

  if (session.finishedAt) {
    const summary: WorkoutSummary = buildSummary(session, exerciseMap);
    const worked = summary.exercises.filter((entry) => entry.sets > 0);
    return (
      <section className="rt-root rt-session rt-session--done" aria-labelledby="rt-summary-title">
        <div className="rt-summary">
          <span className="rt-summary__badge" aria-hidden="true">
            <CheckIcon />
          </span>
          <p className="rt-eyebrow">{summary.routineName}</p>
          <h2 id="rt-summary-title" className="rt-summary__title" tabIndex={-1} ref={summaryRef}>
            {summary.totalSets > 0 ? '운동을 마쳤어요' : '운동을 끝냈어요'}
          </h2>
          <dl className="rt-stats">
            <div className="rt-stat">
              <dt>완료 세트</dt>
              <dd>
                {summary.totalSets}
                <small> / {summary.plannedSets}세트</small>
              </dd>
            </div>
            <div className="rt-stat">
              <dt>총 볼륨</dt>
              <dd>
                {formatKg(summary.volumeKg)}
                <small> kg</small>
              </dd>
            </div>
            <div className="rt-stat">
              <dt>운동 시간</dt>
              <dd>{formatDuration(summary.durationSec)}</dd>
            </div>
          </dl>
          {worked.length > 0 ? (
            <ul className="rt-summary__list">
              {worked.map((entry) => (
                <li key={entry.exerciseId}>
                  <span>{entry.name}</span>
                  <span className="rt-muted">
                    {entry.sets}세트 · {entry.reps}회
                    {entry.volumeKg > 0 ? ` · ${formatKg(entry.volumeKg)}kg` : ''}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rt-muted">완료한 세트가 없어 기록은 남지 않았어요.</p>
          )}
          <button type="button" className="rt-btn rt-btn--primary rt-btn--wide" onClick={handleClose}>
            닫기
          </button>
        </div>
      </section>
    );
  }

  const { done, total } = countSets(session);
  const index = session.currentIndex;
  const item = session.items[index];
  const exercise: Exercise | undefined = exerciseMap.get(item.exerciseId);
  const name = exercise?.name ?? '알 수 없는 운동';
  const firstUndone = item.sets.findIndex((set) => !set.done);
  const lastSet = item.sets[item.sets.length - 1];

  const rest = session.rest;
  const remaining = rest ? restRemainingMs(rest, now) : 0;
  const paused = rest?.pausedRemainingMs != null;
  const restTarget = rest?.advanceTo != null ? session.items[rest.advanceTo] : null;

  const nextOffset = session.items.findIndex(
    (_, step) => step > 0 && session.items[(index + step) % session.items.length].sets.some((set) => !set.done),
  );
  const nextIndex = nextOffset > 0 ? (index + nextOffset) % session.items.length : null;
  const nextItem = nextIndex === null ? null : session.items[nextIndex];
  const nextName = nextItem ? (exerciseMap.get(nextItem.exerciseId)?.name ?? '알 수 없는 운동') : '';
  const nextUndone = nextItem ? nextItem.sets.filter((set) => !set.done) : [];

  return (
    <section className="rt-root rt-session" aria-label={`${session.routineName} 진행`}>
      <header className="rt-session__top">
        <div className="rt-session__heading">
          <p className="rt-eyebrow">운동 중</p>
          <h2 className="rt-session__title">{session.routineName}</h2>
        </div>
        <p className="rt-session__clock">
          <span className="rt-sr">경과 시간 </span>
          {formatClock(elapsedMsAt(session, now))}
        </p>
        {onExit && (
          <button type="button" className="rt-btn" onClick={handleExit}>
            나가기
          </button>
        )}
      </header>

      <div className="rt-progress">
        <div
          className="rt-progress__track"
          role="progressbar"
          aria-label="전체 진행률"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={done}
          aria-valuetext={`${total}세트 중 ${done}세트 완료`}
        >
          <span className="rt-progress__fill" style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }} />
        </div>
        <p className="rt-progress__label">
          <strong>{done}</strong> / {total} 세트
        </p>
      </div>

      {rest && (
        <div className="rt-rest" role="group" aria-label="휴식 타이머">
          <div className="rt-rest__info">
            <p className="rt-rest__label">{paused ? '휴식 일시정지' : '휴식 중'}</p>
            <p className="rt-rest__time" role="timer" aria-live="off">
              {formatClock(Math.ceil(remaining / 1000) * 1000)}
            </p>
            {restTarget && (
              <p className="rt-rest__next">
                다음 운동: {exerciseMap.get(restTarget.exerciseId)?.name ?? '알 수 없는 운동'}
              </p>
            )}
          </div>
          <div className="rt-rest__track" aria-hidden="true">
            <span style={{ width: `${Math.min(100, (remaining / rest.totalMs) * 100)}%` }} />
          </div>
          <div className="rt-rest__actions">
            <button type="button" className="rt-btn" onClick={() => apply(toggleRestPause)}>
              {paused ? <PlayIcon /> : <PauseIcon />}
              {paused ? '계속' : '일시정지'}
            </button>
            <button type="button" className="rt-btn" onClick={() => apply((state, t) => extendRest(state, t))}>
              +15초
            </button>
            <button type="button" className="rt-btn rt-btn--ink" onClick={() => apply(endRest)}>
              <SkipIcon />
              건너뛰기
            </button>
          </div>
        </div>
      )}

      <article className="rt-current" aria-labelledby="rt-current-title">
        <div className="rt-current__nav">
          <button
            type="button"
            className="rt-icon-btn"
            aria-label="이전 운동"
            disabled={index === 0}
            onClick={() => apply((state, t) => goToExercise(state, index - 1, t))}
          >
            <ChevronLeftIcon />
          </button>
          <p className="rt-current__step">
            운동 <strong>{index + 1}</strong> / {session.items.length}
          </p>
          <button
            type="button"
            className="rt-icon-btn"
            aria-label="다음 운동"
            disabled={index === session.items.length - 1}
            onClick={() => apply((state, t) => goToExercise(state, index + 1, t))}
          >
            <ChevronRightIcon />
          </button>
        </div>

        {renderAnimation && exercise && <div className="rt-stage">{renderAnimation(exercise)}</div>}

        <div className="rt-current__head">
          <h3 id="rt-current-title" className="rt-current__title">
            {name}
          </h3>
          {exercise && (
            <p className="rt-muted">
              {muscleNames(exercise.primaryMuscles)}
              {item.restSec > 0 ? ` · 세트 사이 휴식 ${item.restSec}초` : ''}
            </p>
          )}
        </div>

        <ol className="rt-sets" aria-label={`${name} 세트`}>
          {item.sets.map((set, setIndex) => {
            const state = set.done ? 'done' : setIndex === firstUndone ? 'current' : 'todo';
            const label = `${setIndex + 1}세트`;
            return (
              <li key={setIndex} className="rt-set" data-state={state}>
                <span className="rt-set__label">{label}</span>
                <NumberField
                  label={`${label} 횟수`}
                  hideLabel
                  unit="회"
                  value={set.reps}
                  min={LIMITS.reps.min}
                  max={LIMITS.reps.max}
                  disabled={set.done}
                  onCommit={(value) => {
                    if (value !== undefined) apply((s) => updateSet(s, index, setIndex, { reps: value }));
                  }}
                />
                <NumberField
                  label={`${label} 무게(kg)`}
                  hideLabel
                  unit="kg"
                  decimal
                  optional
                  value={set.weightKg}
                  min={LIMITS.weightKg.min}
                  max={LIMITS.weightKg.max}
                  disabled={set.done}
                  onCommit={(value) => apply((s) => updateSet(s, index, setIndex, { weightKg: value ?? 0 }))}
                />
                <button
                  type="button"
                  className="rt-set__check"
                  disabled={set.done}
                  aria-label={set.done ? `${label} 기록됨` : `${label} 완료`}
                  onClick={() => handleComplete(index, setIndex)}
                >
                  <CheckIcon />
                  <span>{set.done ? '기록됨' : '완료'}</span>
                </button>
              </li>
            );
          })}
        </ol>

        <div className="rt-current__foot">
          <button
            type="button"
            className="rt-btn rt-btn--ghost"
            disabled={item.sets.length >= LIMITS.sets.max}
            onClick={() => apply((s) => addSet(s, index))}
          >
            <PlusIcon />
            세트 추가
          </button>
          {item.sets.length > 1 && !lastSet.done && (
            <button type="button" className="rt-btn rt-btn--ghost" onClick={() => apply((s) => removeLastSet(s, index))}>
              마지막 세트 빼기
            </button>
          )}
        </div>
      </article>

      {nextItem && nextIndex !== null && (
        <button
          type="button"
          className="rt-next"
          onClick={() => apply((state, t) => goToExercise(state, nextIndex, t))}
        >
          <span className="rt-next__label">다음 운동</span>
          <span className="rt-next__name">{nextName}</span>
          <span className="rt-next__meta">
            {nextUndone.length}세트 × {nextUndone[0]?.reps ?? 0}회
          </span>
          <ChevronRightIcon />
        </button>
      )}

      <footer className="rt-session__foot">
        {confirmFinish ? (
          <div className="rt-confirm" role="group" aria-label="운동 끝내기 확인">
            <p>아직 {total - done}세트가 남았어요. 여기서 끝낼까요?</p>
            <div className="rt-confirm__actions">
              <button type="button" className="rt-btn" onClick={() => setConfirmFinish(false)}>
                계속하기
              </button>
              <button type="button" className="rt-btn rt-btn--ink" onClick={handleFinish}>
                끝내기
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="rt-btn rt-btn--wide" onClick={() => setConfirmFinish(true)}>
            운동 끝내기
          </button>
        )}
      </footer>

      <p className="rt-sr" role="status" aria-live="polite">
        {announce}
      </p>
    </section>
  );
}
