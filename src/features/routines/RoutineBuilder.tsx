import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { Exercise, MuscleId } from '../../data/exercises';
import { MUSCLE_LABEL, MUSCLE_ORDER, getRoutineStats, muscleNames } from './muscles';
import { clearSavedSession, useSavedSession } from './session';
import { buildStarterTemplates } from './templates';
import type { StarterTemplate } from './templates';
import type { Routine, RoutineBuilderProps, RoutineItem } from './types';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  CloseIcon,
  CopyIcon,
  NumberField,
  PlayIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
} from './ui';
import { LIMITS, itemFromExercise, useRoutines } from './useRoutines';
import type { UseRoutinesResult } from './useRoutines';
import { WorkoutSession } from './WorkoutSession';
import './routines.css';

type ExerciseMap = ReadonlyMap<string, Exercise>;

const totalSetsOf = (routine: Routine) => routine.items.reduce((sum, item) => sum + item.sets, 0);

export function RoutineBuilder({
  exercises,
  onSelectExercise,
  onStartRoutine,
  renderAnimation,
  onLogSet,
  onFinish,
  className,
}: RoutineBuilderProps) {
  const api = useRoutines();
  const { routines } = api;
  const saved = useSavedSession();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [running, setRunning] = useState<Routine | null>(null);
  const [announce, setAnnounce] = useState('');
  const titleId = useId();

  const exerciseMap: ExerciseMap = useMemo(() => new Map(exercises.map((exercise) => [exercise.id, exercise])), [exercises]);
  const templates = useMemo(() => buildStarterTemplates(exercises), [exercises]);
  const selected = routines.find((routine) => routine.id === selectedId) ?? routines[0] ?? null;

  const start = (routine: Routine) => {
    if (!routine.items.some((item) => exerciseMap.has(item.exerciseId))) return;
    if (onStartRoutine) onStartRoutine(routine);
    else setRunning(routine);
  };

  const handleCreate = () => {
    const routine = api.createRoutine();
    setSelectedId(routine.id);
    setAnnounce(`${routine.name} 루틴을 만들었어요.`);
  };

  const handleTemplate = (template: StarterTemplate) => {
    const routine = api.createRoutine(template.name, template.items);
    setSelectedId(routine.id);
    setAnnounce(`${routine.name} 루틴을 만들었어요. 운동 ${routine.items.length}개가 들어 있어요.`);
  };

  if (running) {
    return (
      <WorkoutSession
        routine={running}
        exercises={exercises}
        renderAnimation={renderAnimation}
        onLogSet={onLogSet}
        onFinish={onFinish}
        onExit={() => setRunning(null)}
      />
    );
  }

  return (
    <section className={`rt-root rt-builder${className ? ` ${className}` : ''}`} aria-labelledby={titleId}>
      <header className="rt-head">
        <div>
          <h2 id={titleId} className="rt-head__title">
            루틴
          </h2>
          <p className="rt-muted">자주 하는 운동을 묶어 두고, 순서대로 따라가며 기록하세요.</p>
        </div>
        <button type="button" className="rt-btn rt-btn--primary" onClick={handleCreate}>
          <PlusIcon />새 루틴
        </button>
      </header>

      {api.storageError && (
        <p className="rt-note" role="alert">
          브라우저 저장 공간을 쓸 수 없어요. 지금 바꾼 내용은 새로고침하면 사라질 수 있어요.
        </p>
      )}

      {saved && (
        <div className="rt-resume" role="region" aria-label="진행 중인 운동">
          <div className="rt-resume__text">
            <p className="rt-resume__title">진행 중인 운동이 있어요</p>
            <p className="rt-muted">
              {saved.routineName} · {saved.totalSets}세트 중 {saved.doneSets}세트 완료. 다른 루틴을 시작하면 이 진행 상황은
              사라져요.
            </p>
          </div>
          <div className="rt-resume__actions">
            <button type="button" className="rt-btn rt-btn--ghost" onClick={clearSavedSession}>
              지우기
            </button>
            <button
              type="button"
              className="rt-btn rt-btn--ink"
              onClick={() => start(routines.find((routine) => routine.id === saved.routineId) ?? saved.routine)}
            >
              <PlayIcon />
              이어서 하기
            </button>
          </div>
        </div>
      )}

      {routines.length === 0 || !selected ? (
        <div className="rt-empty">
          <svg className="rt-empty__art" viewBox="0 0 64 64" width="56" height="56" aria-hidden="true" focusable="false">
            <rect x="12" y="10" width="40" height="46" rx="6" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M22 24h20M22 33h20M22 42h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="46" cy="46" r="10" className="rt-empty__dot" />
            <path d="M46 41v10M41 46h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <h3 className="rt-empty__title">아직 만든 루틴이 없어요</h3>
          <p className="rt-empty__text">
            {templates.length > 0
              ? '아래 추천 루틴을 한 번 눌러 바로 시작하거나, 빈 루틴에 원하는 운동을 직접 담아 보세요.'
              : '빈 루틴을 만들고 원하는 운동을 직접 담아 보세요.'}
          </p>
          <button type="button" className="rt-btn" onClick={handleCreate}>
            <PlusIcon />빈 루틴 만들기
          </button>
        </div>
      ) : (
        <div className="rt-layout">
          <nav className="rt-list" aria-label="내 루틴">
            <ul>
              {routines.map((routine) => (
                <li key={routine.id}>
                  <button
                    type="button"
                    className="rt-list__item"
                    aria-current={routine.id === selected.id ? 'true' : undefined}
                    onClick={() => setSelectedId(routine.id)}
                  >
                    <span className="rt-list__name">{routine.name}</span>
                    <span className="rt-list__meta">
                      운동 {routine.items.length}개 · {totalSetsOf(routine)}세트
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          <RoutineEditor
            key={selected.id}
            routine={selected}
            api={api}
            exercises={exercises}
            exerciseMap={exerciseMap}
            onSelectExercise={onSelectExercise}
            onStart={() => start(selected)}
            onSelectRoutine={setSelectedId}
            onAnnounce={setAnnounce}
          />
        </div>
      )}

      {templates.length > 0 && (
        <section className="rt-templates" aria-label="추천 루틴">
          <h3 className="rt-section-title">추천 루틴으로 바로 시작</h3>
          <ul className="rt-templates__grid">
            {templates.map((template) => (
              <li key={template.id}>
                <button type="button" className="rt-template" onClick={() => handleTemplate(template)}>
                  <span className="rt-template__name">{template.name}</span>
                  <span className="rt-template__desc">{template.description}</span>
                  <span className="rt-template__meta">
                    운동 {template.items.length}개 · {template.items.reduce((sum, item) => sum + item.sets, 0)}세트
                  </span>
                  <span className="rt-template__add">
                    <PlusIcon />
                    루틴에 추가
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="rt-sr" role="status" aria-live="polite">
        {announce}
      </p>
    </section>
  );
}

interface RoutineEditorProps {
  routine: Routine;
  api: UseRoutinesResult;
  exercises: Exercise[];
  exerciseMap: ExerciseMap;
  onSelectExercise?: (id: string) => void;
  onStart: () => void;
  onSelectRoutine: (id: string) => void;
  onAnnounce: (message: string) => void;
}

function RoutineEditor({
  routine,
  api,
  exercises,
  exerciseMap,
  onSelectExercise,
  onStart,
  onSelectRoutine,
  onAnnounce,
}: RoutineEditorProps) {
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(routine.items.length === 0);
  const listRef = useRef<HTMLOListElement>(null);
  const pendingFocus = useRef<{ exerciseId: string; direction: 'up' | 'down' } | null>(null);
  const nameId = useId();
  const pickerId = useId();

  const stats = useMemo(() => getRoutineStats(routine.items, exerciseMap), [routine.items, exerciseMap]);
  const canStart = routine.items.some((item) => exerciseMap.has(item.exerciseId));

  // 순서를 옮긴 뒤에도 키보드 포커스가 같은 운동의 버튼에 남도록 합니다.
  useEffect(() => {
    const pending = pendingFocus.current;
    if (!pending || !listRef.current) return;
    pendingFocus.current = null;
    const row = Array.from(listRef.current.querySelectorAll<HTMLElement>('[data-rt-item]')).find(
      (element) => element.dataset.rtItem === pending.exerciseId,
    );
    const preferred = row?.querySelector<HTMLButtonElement>(`[data-rt-move="${pending.direction}"]`);
    const fallback = row?.querySelector<HTMLButtonElement>(`[data-rt-move="${pending.direction === 'up' ? 'down' : 'up'}"]`);
    (preferred && !preferred.disabled ? preferred : fallback)?.focus();
  }, [routine.items]);

  const commitName = () => {
    if (nameDraft !== null && nameDraft.trim()) api.renameRoutine(routine.id, nameDraft);
    setNameDraft(null);
  };

  const move = (exerciseId: string, direction: 'up' | 'down', name: string) => {
    const from = routine.items.findIndex((item) => item.exerciseId === exerciseId);
    const to = direction === 'up' ? from - 1 : from + 1;
    if (from < 0 || to < 0 || to >= routine.items.length) return;
    pendingFocus.current = { exerciseId, direction };
    api.moveItem(routine.id, exerciseId, direction);
    onAnnounce(`${name}: ${routine.items.length}개 중 ${to + 1}번째로 옮겼어요.`);
  };

  const toggleExercise = (exercise: Exercise) => {
    if (routine.items.some((item) => item.exerciseId === exercise.id)) {
      api.removeItem(routine.id, exercise.id);
      onAnnounce(`${exercise.name}: 루틴에서 뺐어요.`);
    } else {
      api.addItem(routine.id, itemFromExercise(exercise));
      onAnnounce(`${exercise.name}: 루틴에 추가했어요.`);
    }
  };

  const handleDuplicate = () => {
    const copy = api.duplicateRoutine(routine.id);
    if (!copy) return;
    onSelectRoutine(copy.id);
    onAnnounce(`${copy.name} 루틴을 만들었어요.`);
  };

  const handleDelete = () => {
    api.deleteRoutine(routine.id);
    onAnnounce(`${routine.name} 루틴을 삭제했어요.`);
  };

  return (
    <div className="rt-editor">
      <div className="rt-editor__top">
        <div className="rt-name">
          <label className="rt-field__label" htmlFor={nameId}>
            루틴 이름
          </label>
          <input
            id={nameId}
            className="rt-name__input"
            type="text"
            maxLength={LIMITS.name}
            autoComplete="off"
            value={nameDraft ?? routine.name}
            onChange={(event) => setNameDraft(event.target.value)}
            onBlur={commitName}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur();
              if (event.key === 'Escape') setNameDraft(null);
            }}
          />
        </div>
        <div className="rt-editor__actions">
          <button type="button" className="rt-btn" onClick={handleDuplicate}>
            <CopyIcon />
            복제
          </button>
          {confirmDelete ? (
            <span className="rt-confirm rt-confirm--inline" role="group" aria-label="루틴 삭제 확인">
              <span>삭제할까요?</span>
              <button type="button" className="rt-btn" onClick={() => setConfirmDelete(false)}>
                취소
              </button>
              <button type="button" className="rt-btn rt-btn--danger" onClick={handleDelete}>
                삭제
              </button>
            </span>
          ) : (
            <button type="button" className="rt-btn" onClick={() => setConfirmDelete(true)}>
              <TrashIcon />
              삭제
            </button>
          )}
          <button
            type="button"
            className="rt-btn rt-btn--primary"
            disabled={!canStart}
            title={canStart ? undefined : '운동을 한 개 이상 추가하면 시작할 수 있어요'}
            onClick={onStart}
          >
            <PlayIcon />
            운동 시작
          </button>
        </div>
      </div>

      <div className="rt-chips" role="group" aria-label="루틴 요약">
        <span className="rt-chip rt-chip--strong">총 {stats.totalSets}세트</span>
        <span className="rt-chip">운동 {stats.exerciseCount}개</span>
        {stats.totalSets > 0 && <span className="rt-chip">약 {Math.max(1, stats.estimatedMinutes)}분</span>}
        {stats.coverage.map((entry) => (
          <span key={entry.id} className={`rt-chip ${entry.primary > 0 ? 'rt-chip--primary' : 'rt-chip--secondary'}`}>
            <strong>{entry.name}</strong>
            {entry.primary > 0 && <span>주동 {entry.primary}</span>}
            {entry.secondary > 0 && <span>보조 {entry.secondary}</span>}
          </span>
        ))}
      </div>

      {routine.items.length === 0 ? (
        <p className="rt-editor__empty">아직 담은 운동이 없어요. 아래에서 운동을 골라 추가해 주세요.</p>
      ) : (
        <ol className="rt-items" ref={listRef} aria-label={`${routine.name} 운동 순서`}>
          {routine.items.map((item, index) => (
            <ItemRow
              key={item.exerciseId}
              item={item}
              index={index}
              count={routine.items.length}
              exercise={exerciseMap.get(item.exerciseId)}
              onSelectExercise={onSelectExercise}
              onMove={move}
              onRemove={(name) => {
                api.removeItem(routine.id, item.exerciseId);
                onAnnounce(`${name}: 루틴에서 뺐어요.`);
              }}
              onChange={(patch) => api.updateItem(routine.id, item.exerciseId, patch)}
            />
          ))}
        </ol>
      )}

      <div className="rt-picker-wrap">
        <button
          type="button"
          className="rt-btn rt-btn--wide"
          aria-expanded={pickerOpen}
          aria-controls={pickerId}
          onClick={() => setPickerOpen((open) => !open)}
        >
          {pickerOpen ? <CloseIcon /> : <PlusIcon />}
          {pickerOpen ? '운동 목록 닫기' : '운동 추가'}
        </button>
        <div id={pickerId} hidden={!pickerOpen}>
          {pickerOpen && <ExercisePicker exercises={exercises} items={routine.items} onToggle={toggleExercise} />}
        </div>
      </div>
    </div>
  );
}

interface ItemRowProps {
  item: RoutineItem;
  index: number;
  count: number;
  exercise: Exercise | undefined;
  onSelectExercise?: (id: string) => void;
  onMove: (exerciseId: string, direction: 'up' | 'down', name: string) => void;
  onRemove: (name: string) => void;
  onChange: (patch: Partial<Omit<RoutineItem, 'exerciseId'>>) => void;
}

function ItemRow({ item, index, count, exercise, onSelectExercise, onMove, onRemove, onChange }: ItemRowProps) {
  const name = exercise?.name ?? '찾을 수 없는 운동';
  return (
    <li className="rt-item" data-rt-item={item.exerciseId}>
      <div className="rt-item__head">
        <span className="rt-item__order" aria-hidden="true">
          {index + 1}
        </span>
        <div className="rt-item__title">
          {exercise && onSelectExercise ? (
            <button type="button" className="rt-link" onClick={() => onSelectExercise(exercise.id)}>
              {name}
              <span className="rt-sr"> 자세히 보기</span>
            </button>
          ) : (
            <span className="rt-item__name">{name}</span>
          )}
          <span className="rt-muted">
            {exercise ? muscleNames(exercise.primaryMuscles) : '운동 목록에 없는 항목이라 시작할 때 건너뛰어요.'}
          </span>
        </div>
        <div className="rt-item__actions" role="group" aria-label={`${name} 순서 변경과 삭제`}>
          <button
            type="button"
            className="rt-icon-btn"
            data-rt-move="up"
            aria-label={`${name} 위로 올리기`}
            disabled={index === 0}
            onClick={() => onMove(item.exerciseId, 'up', name)}
          >
            <ArrowUpIcon />
          </button>
          <button
            type="button"
            className="rt-icon-btn"
            data-rt-move="down"
            aria-label={`${name} 아래로 내리기`}
            disabled={index === count - 1}
            onClick={() => onMove(item.exerciseId, 'down', name)}
          >
            <ArrowDownIcon />
          </button>
          <button type="button" className="rt-icon-btn" aria-label={`${name} 루틴에서 빼기`} onClick={() => onRemove(name)}>
            <TrashIcon />
          </button>
        </div>
      </div>
      <div className="rt-item__fields" role="group" aria-label={`${name} 설정`}>
        <NumberField
          label="세트"
          value={item.sets}
          min={LIMITS.sets.min}
          max={LIMITS.sets.max}
          onCommit={(value) => value !== undefined && onChange({ sets: value })}
        />
        <NumberField
          label="횟수"
          value={item.reps}
          min={LIMITS.reps.min}
          max={LIMITS.reps.max}
          onCommit={(value) => value !== undefined && onChange({ reps: value })}
        />
        <NumberField
          label="무게(kg)"
          value={item.weightKg}
          min={LIMITS.weightKg.min}
          max={LIMITS.weightKg.max}
          decimal
          optional
          placeholder="맨몸"
          onCommit={(value) => onChange({ weightKg: value })}
        />
        <NumberField
          label="휴식(초)"
          value={item.restSec}
          min={LIMITS.restSec.min}
          max={LIMITS.restSec.max}
          onCommit={(value) => value !== undefined && onChange({ restSec: value })}
        />
      </div>
    </li>
  );
}

interface ExercisePickerProps {
  exercises: Exercise[];
  items: RoutineItem[];
  onToggle: (exercise: Exercise) => void;
}

function ExercisePicker({ exercises, items, onToggle }: ExercisePickerProps) {
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<MuscleId | 'all'>('all');
  const searchId = useId();

  const added = useMemo(() => new Set(items.map((item) => item.exerciseId)), [items]);
  const available = useMemo(() => {
    const present = new Set<MuscleId>();
    for (const exercise of exercises) {
      exercise.primaryMuscles.forEach((id) => present.add(id));
      exercise.secondaryMuscles.forEach((id) => present.add(id));
    }
    return MUSCLE_ORDER.filter((id) => present.has(id));
  }, [exercises]);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return exercises.filter((exercise) => {
      if (muscle !== 'all' && !exercise.primaryMuscles.includes(muscle) && !exercise.secondaryMuscles.includes(muscle)) {
        return false;
      }
      if (!needle) return true;
      return exercise.name.toLowerCase().includes(needle) || exercise.englishName.toLowerCase().includes(needle);
    });
  }, [exercises, query, muscle]);

  const filtered = query.trim() !== '' || muscle !== 'all';

  return (
    <div className="rt-picker">
      <div className="rt-search">
        <label className="rt-sr" htmlFor={searchId}>
          운동 검색
        </label>
        <SearchIcon />
        <input
          id={searchId}
          className="rt-search__input"
          type="search"
          placeholder="운동 이름으로 검색"
          autoComplete="off"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <div className="rt-filter" role="group" aria-label="부위로 걸러 보기">
        <button type="button" className="rt-pill" aria-pressed={muscle === 'all'} onClick={() => setMuscle('all')}>
          전체
        </button>
        {available.map((id) => (
          <button key={id} type="button" className="rt-pill" aria-pressed={muscle === id} onClick={() => setMuscle(id)}>
            {MUSCLE_LABEL[id]}
          </button>
        ))}
      </div>
      <p className="rt-picker__count" role="status">
        운동 {results.length}개
      </p>
      {results.length === 0 ? (
        <div className="rt-picker__empty">
          <p>{exercises.length === 0 ? '아직 불러온 운동이 없어요.' : '조건에 맞는 운동이 없어요.'}</p>
          {filtered && (
            <button
              type="button"
              className="rt-btn"
              onClick={() => {
                setQuery('');
                setMuscle('all');
              }}
            >
              검색 조건 지우기
            </button>
          )}
        </div>
      ) : (
        <ul className="rt-picker__list">
          {results.map((exercise) => {
            const isAdded = added.has(exercise.id);
            return (
              <li key={exercise.id} className="rt-option">
                <div className="rt-option__text">
                  <span className="rt-option__name">{exercise.name}</span>
                  <span className="rt-muted">
                    {muscleNames(exercise.primaryMuscles)}
                    {exercise.secondaryMuscles.length > 0 ? ` (보조: ${muscleNames(exercise.secondaryMuscles)})` : ''}
                  </span>
                </div>
                <button
                  type="button"
                  className="rt-btn rt-option__btn"
                  aria-pressed={isAdded}
                  aria-label={isAdded ? `${exercise.name} 추가됨, 누르면 빼기` : `${exercise.name} 추가`}
                  onClick={() => onToggle(exercise)}
                >
                  {isAdded ? <CheckIcon /> : <PlusIcon />}
                  {isAdded ? '추가됨' : '추가'}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
