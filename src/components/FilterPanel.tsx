import { RotateCcw } from "lucide-react";
import { equipment, muscles } from "../data/exercises";
import type { EquipmentId, MuscleId } from "../data/exercises";
interface Props {
  muscle: MuscleId | "all";
  onMuscle: (value: MuscleId | "all") => void;
  available: EquipmentId[];
  onEquipment: (id: EquipmentId) => void;
  onlyAvailable: boolean;
  onOnlyAvailable: (value: boolean) => void;
  reset: () => void;
}
export default function FilterPanel({
  muscle,
  onMuscle,
  available,
  onEquipment,
  onlyAvailable,
  onOnlyAvailable,
  reset,
}: Props) {
  return (
    <aside className="filter-panel panel" aria-label="운동 필터">
      <div className="section-heading">
        <h2>운동 부위</h2>
        <button
          className="icon-button"
          onClick={reset}
          aria-label="필터 초기화"
          title="필터 초기화"
        >
          <RotateCcw size={15} />
        </button>
      </div>
      <div className="muscle-options" role="group" aria-label="운동 부위 선택">
        {[{ id: "all" as const, name: "전체" }, ...muscles].map((item) => (
          <button
            key={item.id}
            onClick={() => onMuscle(item.id)}
            aria-pressed={muscle === item.id}
            className={`muscle-option ${muscle === item.id ? "active" : ""}`}
          >
            <span className="radio-dot" />
            {item.name}
          </button>
        ))}
      </div>
      <div className="equipment-section">
        <h2>사용 가능한 기구</h2>
        <label className="switch-label">
          내 기구로만 보기
          <input
            role="switch"
            type="checkbox"
            checked={onlyAvailable}
            onChange={(e) => onOnlyAvailable(e.target.checked)}
          />
          <span className="switch-track" />
        </label>
        <div className="equipment-options">
          {equipment
            .filter((item) => item.id !== "bodyweight")
            .map((item) => (
              <label key={item.id}>
                <input
                  type="checkbox"
                  checked={available.includes(item.id)}
                  onChange={() => onEquipment(item.id)}
                />
                {item.name}
              </label>
            ))}
        </div>
        <p className="filter-note">
          맨몸 운동은 항상 가능해요.
          <br />
          필요한 기구가 모두 있는 운동을 찾아요.
        </p>
      </div>
    </aside>
  );
}
