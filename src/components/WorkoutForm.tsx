import { useState } from "react";
import { Check, Plus } from "lucide-react";
import type { Exercise } from "../data/exercises";
import { exerciseMeasurement } from "../data/exercise-measurement";
export interface WorkoutRecord {
  id: string;
  exerciseId: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
  date: string;
}
export function validRecords(value: unknown): value is WorkoutRecord[] {
  return (
    Array.isArray(value) &&
    value.every(
      (v) =>
        v &&
        typeof v.id === "string" &&
        typeof v.exerciseId === "string" &&
        typeof v.name === "string" &&
        Number.isFinite(v.sets) &&
        v.sets > 0 &&
        Number.isFinite(v.reps) &&
        v.reps > 0 &&
        Number.isFinite(v.weight) &&
        v.weight >= 0 &&
        typeof v.date === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(v.date),
    )
  );
}
function localToday() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export default function WorkoutForm({
  exercise,
  onSave,
}: {
  exercise: Exercise;
  onSave: (record: WorkoutRecord) => void;
}) {
  const [saved, setSaved] = useState(false);
  const measurement = exerciseMeasurement(exercise);
  return (
    <section className="record-section">
      <div className="section-heading">
        <h3>오늘의 움직임 기록</h3>
        <span>작은 기록이 쌓여, 나만의 루틴으로.</span>
      </div>
      <form
        className="record-form"
        onChange={() => setSaved(false)}
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          onSave({
            id: crypto.randomUUID(),
            exerciseId: exercise.id,
            name: exercise.name,
            sets: Number(data.get("sets")),
            reps: Number(data.get("reps")),
            weight: Number(data.get("weight")),
            date: String(data.get("date")),
          });
          setSaved(true);
        }}
      >
        <label>
          세트
          <input
            name="sets"
            type="number"
            min="1"
            max="100"
            step="1"
            required
            defaultValue={exercise.defaultSets}
          />
        </label>
        <label>
          {measurement.repsLabel}
          <input
            name="reps"
            type="number"
            min="1"
            max="1000"
            step="1"
            required
            defaultValue={exercise.defaultReps}
          />
        </label>
        <label>
          무게 (kg)
          <input
            name="weight"
            type="number"
            min="0"
            max="2000"
            step="0.5"
            required
            defaultValue="0"
          />
        </label>
        <label className="date-field">
          날짜
          <input name="date" type="date" required defaultValue={localToday()} />
        </label>
        <button className="button primary" type="submit">
          {saved ? <Check size={16} /> : <Plus size={16} />}기록 저장
        </button>
      </form>
      <p className="save-status" role="status">
        {saved
          ? "기록을 저장했어요. 운동 기록에서 확인하세요."
          : measurement.guidance}
      </p>
    </section>
  );
}
