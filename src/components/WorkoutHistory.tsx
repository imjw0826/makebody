import { Trash2, ClipboardList } from "lucide-react";
import { exercises } from "../data/exercises";
import { extraExercises } from "../data/exercises.extra";
import { exerciseMeasurement } from "../data/exercise-measurement";
import type { WorkoutRecord } from "./WorkoutForm";

const exercisesById = new Map(
  [...exercises, ...extraExercises].map((exercise) => [exercise.id, exercise]),
);
export default function WorkoutHistory({
  records,
  onDelete,
  onLibrary,
  compact = false,
}: {
  records: WorkoutRecord[];
  onDelete: (id: string) => void;
  onLibrary?: () => void;
  compact?: boolean;
}) {
  return (
    <section
      className={
        compact ? "history compact-history" : "history history-page panel"
      }
      aria-label="저장된 운동 기록"
    >
      <div className="section-heading">
        <h2>{compact ? "이 운동의 기록" : "나의 운동 기록"}</h2>
        <span>{records.length}개의 기록</span>
      </div>
      {records.length ? (
        <div className="history-rows">
          {[...records]
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((record) => (
              <article className="history-row" key={record.id}>
                <span className="history-icon">
                  <ClipboardList size={20} />
                </span>
                <div>
                  <strong>{record.name}</strong>
                  <p>
                    {record.date} <span>·</span> {record.sets}세트 ×{" "}
                    {record.reps}
                    {exerciseMeasurement(exercisesById.get(record.exerciseId))
                      .repsSuffix}{" "}
                    <span>·</span> {record.weight}kg
                  </p>
                </div>
                <button
                  className="icon-button delete-button"
                  aria-label={`${record.name} ${record.date} 기록 삭제`}
                  onClick={() => onDelete(record.id)}
                >
                  <Trash2 size={17} />
                </button>
              </article>
            ))}
        </div>
      ) : (
        <div className="empty-state">
          <ClipboardList size={32} />
          <h3>첫 움직임을 기록해보세요</h3>
          <p>
            저장한 세트와 반복 횟수가 여기에 쌓여요.
            <br />
            기록은 이 브라우저에 보관됩니다.
          </p>
          {onLibrary && (
            <button className="button primary" onClick={onLibrary}>
              운동 둘러보기
            </button>
          )}
        </div>
      )}
    </section>
  );
}
