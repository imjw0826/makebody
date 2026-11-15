import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { exercises as baseExercises, muscles } from "./data/exercises";
import { extraExercises } from "./data/exercises.extra";
import ExerciseAnimation from "./components/ExerciseAnimation";
import { RoutineBuilder } from "./features/routines";
import { InsightsPanel } from "./features/insights";
import type { LogEntry } from "./features/insights";
import type { EquipmentId, MuscleId } from "./data/exercises";
import FilterPanel from "./components/FilterPanel";
import ExerciseList from "./components/ExerciseList";
import ExerciseDetail from "./components/ExerciseDetail";
import WorkoutHistory from "./components/WorkoutHistory";
import { validRecords } from "./components/WorkoutForm";
import type { WorkoutRecord } from "./components/WorkoutForm";
import { useStoredState } from "./hooks/useStoredState";
const exercises = [...baseExercises, ...extraExercises];
type View = "library" | "routines" | "insights" | "history";
const validFavorites = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((id) => typeof id === "string");
export default function App() {
  const [view, setView] = useState<View>("library");
  const [listView, setListView] = useState<"list" | "grid">("grid");
  const [muscle, setMuscle] = useState<MuscleId | "all">("all");
  const [query, setQuery] = useState("");
  const [available, setAvailable] = useState<EquipmentId[]>([]);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [selectedId, setSelectedId] = useState(
    "cable-triceps-pressdown",
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [favorites, setFavorites, favoriteError] = useStoredState(
    "form:favorites:v1",
    [],
    validFavorites,
  );
  const [records, setRecords, recordError] = useStoredState<WorkoutRecord[]>(
    "form:records:v1",
    [],
    validRecords,
  );
  const filtered = exercises.filter(
    (exercise) =>
      (muscle === "all" ||
        exercise.primaryMuscles.includes(muscle) ||
        exercise.secondaryMuscles.includes(muscle)) &&
      (!onlyFavorites || favorites.includes(exercise.id)) &&
      (!onlyAvailable ||
        exercise.equipment.every(
          (id) => id === "bodyweight" || available.includes(id),
        )) &&
      `${exercise.name} ${exercise.englishName}`
        .toLocaleLowerCase()
        .includes(query.trim().toLocaleLowerCase()),
  );
  const selected = filtered.find((e) => e.id === selectedId) ?? filtered[0];
  const toggleFavorite = (id: string) =>
    setFavorites((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id],
    );
  const reset = () => {
    setMuscle("all");
    setQuery("");
    setAvailable([]);
    setOnlyAvailable(false);
    setOnlyFavorites(false);
  };
  const insightLogs = useMemo<LogEntry[]>(
    () =>
      records.map((r) => ({
        id: r.id,
        exerciseId: r.exerciseId,
        date: r.date,
        sets: r.sets,
        reps: r.reps,
        weightKg: r.weight,
      })),
    [records],
  );
  const logSet = (entry: {
    exerciseId: string;
    date: string;
    reps: number;
    weightKg: number;
  }) =>
    setRecords((previous) => {
      const same = previous.find(
        (r) =>
          r.exerciseId === entry.exerciseId &&
          r.date === entry.date &&
          r.reps === entry.reps &&
          r.weight === entry.weightKg,
      );
      if (same)
        return previous.map((r) =>
          r === same ? { ...r, sets: r.sets + 1 } : r,
        );
      return [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          exerciseId: entry.exerciseId,
          name:
            exercises.find((e) => e.id === entry.exerciseId)?.name ??
            entry.exerciseId,
          sets: 1,
          reps: entry.reps,
          weight: entry.weightKg,
          date: entry.date,
        },
        ...previous,
      ];
    });
  const deleteRecord = (id: string) =>
    setRecords((previous) => previous.filter((record) => record.id !== id));
  return (
    <>
      <a className="skip-link" href="#main-content">
        본문으로 건너뛰기
      </a>
      <header className="app-header">
        <nav aria-label="주 메뉴">
          <button
            className={view === "library" ? "active" : ""}
            onClick={() => setView("library")}
          >
            운동 라이브러리
          </button>
          <button
            className={view === "routines" ? "active" : ""}
            onClick={() => setView("routines")}
          >
            루틴
          </button>
          <button
            className={view === "insights" ? "active" : ""}
            onClick={() => setView("insights")}
          >
            통계
          </button>
          <button
            className={view === "history" ? "active" : ""}
            onClick={() => setView("history")}
          >
            운동 기록
            {records.length ? (
              <span className="nav-count">{records.length}</span>
            ) : null}
          </button>
        </nav>
      </header>
      <main id="main-content">
        {favoriteError || recordError ? (
          <p className="storage-error" role="alert">
            {favoriteError || recordError}
          </p>
        ) : null}
        {view === "library" ? (
          <>
            <button
              className="button mobile-filter-button"
              aria-expanded={filtersOpen}
              aria-controls="filters"
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              <SlidersHorizontal size={16} />
              운동 부위 · 기구 필터
              <span>{filtersOpen ? "접기" : "펼치기"}</span>
            </button>
            <div className={`workspace ${listView === "grid" ? "workspace--grid" : ""}`}>
              <div
                id="filters"
                className={`filter-wrapper ${filtersOpen ? "open" : ""}`}
              >
                <FilterPanel
                  muscle={muscle}
                  onMuscle={setMuscle}
                  available={available}
                  onEquipment={(id) =>
                    setAvailable((previous) =>
                      previous.includes(id)
                        ? previous.filter((item) => item !== id)
                        : [...previous, id],
                    )
                  }
                  onlyAvailable={onlyAvailable}
                  onOnlyAvailable={setOnlyAvailable}
                  reset={reset}
                />
              </div>
              <ExerciseList
                view={listView}
                onView={setListView}
                items={filtered}
                query={query}
                onQuery={setQuery}
                selectedId={selected?.id}
                onSelect={(id) => {
                  setSelectedId(id);
                  if (window.innerWidth < 760 || listView === "grid")
                    document
                      .getElementById("exercise-detail-anchor")
                      ?.scrollIntoView({
                        behavior: window.matchMedia(
                          "(prefers-reduced-motion: reduce)",
                        ).matches
                          ? "instant"
                          : "smooth",
                      });
                }}
                favorites={favorites}
                onFavorite={toggleFavorite}
                onlyFavorites={onlyFavorites}
                onOnlyFavorites={() => setOnlyFavorites(!onlyFavorites)}
                reset={reset}
              />
              <div id="exercise-detail-anchor">
                {selected ? (
                  <ExerciseDetail
                    exercise={selected}
                    favorite={favorites.includes(selected.id)}
                    onFavorite={() => toggleFavorite(selected.id)}
                    onSave={(record) =>
                      setRecords((previous) => [record, ...previous])
                    }
                    records={records.filter(
                      (record) => record.exerciseId === selected.id,
                    )}
                    onDelete={deleteRecord}
                  />
                ) : (
                  <section className="panel detail-empty empty-state">
                    <SlidersHorizontal size={32} />
                    <h2>다음 움직임을 찾아볼까요?</h2>
                    <p>필터를 초기화하면 모든 운동을 볼 수 있어요.</p>
                    <button className="button primary" onClick={reset}>
                      모든 운동 보기
                    </button>
                  </section>
                )}
              </div>
            </div>
          </>
        ) : view === "routines" ? (
          <RoutineBuilder
            exercises={exercises}
            onSelectExercise={(id) => {
              reset();
              setSelectedId(id);
              setView("library");
            }}
            renderAnimation={(exercise) => (
              <ExerciseAnimation exercise={exercise} playing compact />
            )}
            onLogSet={logSet}
          />
        ) : view === "insights" ? (
          <InsightsPanel
            logs={insightLogs}
            exercises={exercises}
            muscles={muscles}
            onStartLogging={() => setView("library")}
          />
        ) : (
          <WorkoutHistory
            records={records}
            onDelete={deleteRecord}
            onLibrary={() => setView("library")}
          />
        )}

      </main>
    </>
  );
}
