import { useState } from "react";
import { Pause, Play, Star, Info } from "lucide-react";
import ExerciseAnimation, { exerciseMedia, exerciseMediaUrl } from "./ExerciseAnimation";
import WorkoutForm from "./WorkoutForm";
import WorkoutHistory from "./WorkoutHistory";
import type { WorkoutRecord } from "./WorkoutForm";
import { equipment, muscles } from "../data/exercises";
import type { Exercise } from "../data/exercises";
export default function ExerciseDetail({
  exercise,
  favorite,
  onFavorite,
  onSave,
  records,
  onDelete,
}: {
  exercise: Exercise;
  favorite: boolean;
  onFavorite: () => void;
  onSave: (record: WorkoutRecord) => void;
  records: WorkoutRecord[];
  onDelete: (id: string) => void;
}) {
  const [playing, setPlaying] = useState(
    () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [speed, setSpeed] = useState(1);
  const [tab, setTab] = useState<"guide" | "history">("guide");
  const media = exerciseMedia(exercise.id);

  return (
    <section
      className="exercise-detail panel"
      aria-label={`${exercise.name} 상세`}
    >
      <div className="detail-heading">
        <div>
          <h2>{exercise.name}</h2>
          <p>{exercise.englishName}</p>
        </div>
        <span className="difficulty">
          {
            { beginner: "초급", intermediate: "중급", advanced: "고급" }[
              exercise.difficulty
            ]
          }
        </span>
        <button
          className={`star-button detail-star ${favorite ? "is-favorite" : ""}`}
          aria-label={`${exercise.name} 즐겨찾기`}
          aria-pressed={favorite}
          onClick={onFavorite}
        >
          <Star size={24} />
        </button>
      </div>
      <div className="animation-stage">
        <p className="stage-note">
          근육을 강조한 동작 애니메이션
        </p>
        <ExerciseAnimation
          exercise={exercise}
          playing={playing}
          speed={speed}
        />
      </div>
      <div className="playback-bar">
        <button
          className="button playback-button"
          onClick={() => setPlaying(!playing)}
        >
          {playing ? (
            <Pause size={16} fill="currentColor" />
          ) : (
            <Play size={16} fill="currentColor" />
          )}
          {playing ? "일시정지" : "재생"}
        </button>
        <label className="speed-control">
          <span className="sr-only">재생 속도</span>
          <select
            aria-label="재생 속도"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          >
            <option value={0.5}>0.5×</option>
            <option value={1}>1×</option>
            <option value={1.5}>1.5×</option>
            <option value={2}>2×</option>
          </select>
        </label>
        <div className="muscle-legend"><span><i style={{background: '#df483d'}} />강조 근육</span></div>
        <a className="gif-download" href={exerciseMediaUrl(exercise.id, media.gif)} download={`${exercise.id}.gif`}>GIF 저장</a>
      </div>
      <div className="muscle-summary">
        <span className="muscle-summary-label">주동근</span>
        {exercise.primaryMuscles.map(id => <span className="primary-muscle" key={id}>{muscles.find(m => m.id === id)?.name}</span>)}
        {exercise.secondaryMuscles.length > 0 && <span className="muscle-summary-label">보조근</span>}
        {exercise.secondaryMuscles.map(id => <span key={id}>{muscles.find(m => m.id === id)?.name}</span>)}
      </div>
      <div
        className="detail-tabs"
        role="tablist"
        aria-label="운동 상세 탭"
        onKeyDown={(event) => {
          if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
            event.preventDefault();
            const next =
              event.key === "Home"
                ? "guide"
                : event.key === "End"
                  ? "history"
                  : tab === "guide"
                    ? "history"
                    : "guide";
            setTab(next);
            document.getElementById(`${next}-tab`)?.focus();
          }
        }}
      >
        <button
          id="guide-tab"
          tabIndex={tab === "guide" ? 0 : -1}
          aria-controls="guide-panel"
          role="tab"
          aria-selected={tab === "guide"}
          onClick={() => setTab("guide")}
        >
          운동 방법
        </button>
        <button
          id="history-tab"
          tabIndex={tab === "history" ? 0 : -1}
          aria-controls="history-panel"
          role="tab"
          aria-selected={tab === "history"}
          onClick={() => setTab("history")}
        >
          운동 기록{records.length ? <span>{records.length}</span> : null}
        </button>
      </div>
      {tab === "guide" ? (
        <div role="tabpanel" id="guide-panel" aria-labelledby="guide-tab">
          <ol className="instructions">
            {exercise.instructions.map((instruction, index) => (
              <li key={instruction}>
                <span>{index + 1}</span>
                <p>{instruction}</p>
              </li>
            ))}
          </ol>
          <div className="equipment-required">
            <strong>사용 기구</strong>
            {exercise.equipment.map((id) => (
              <span className="gear-tag" key={id}>
                {equipment.find((item) => item.id === id)?.name}
              </span>
            ))}
            <span className="target-muscles">
              {exercise.primaryMuscles
                .map((id) => muscles.find((m) => m.id === id)?.name)
                .join(" · ")}
            </span>
          </div>
          <details className="tips">
            <summary>
              <Info size={14} />폼 체크 포인트
            </summary>
            <ul>
              {exercise.tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </details>
        </div>
      ) : (
        <div role="tabpanel" id="history-panel" aria-labelledby="history-tab">
          <WorkoutHistory compact records={records} onDelete={onDelete} />
        </div>
      )}
      <WorkoutForm key={exercise.id} exercise={exercise} onSave={onSave} />
    </section>
  );
}
