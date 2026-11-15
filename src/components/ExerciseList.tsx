import { useEffect, useRef } from "react";
import { Search, Star, ArrowUpRight } from "lucide-react";
import { exerciseMedia } from "./ExerciseAnimation";
import type { Exercise } from "../data/exercises";
interface Props {
  items: Exercise[];
  query: string;
  onQuery: (value: string) => void;
  selectedId?: string;
  onSelect: (id: string) => void;
  favorites: string[];
  onFavorite: (id: string) => void;
  onlyFavorites: boolean;
  onOnlyFavorites: () => void;
  reset: () => void;
}
export default function ExerciseList(p: Props) {
  const rows = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const selected = rows.current?.querySelector<HTMLElement>(".selected");
    if (rows.current && selected) rows.current.scrollTop = Math.max(0, selected.offsetTop - 80);
  }, [p.selectedId, p.items.length]);
  return (
    <section className="exercise-list panel" aria-label="운동 목록">
      <div className="list-tools">
        <label className="search-box">
          <Search size={19} />
          <input
            type="search"
            aria-label="운동 이름 검색"
            placeholder="운동 이름 검색"
            value={p.query}
            onChange={(e) => p.onQuery(e.target.value)}
          />
        </label>
        <div className="list-count">
          <span aria-live="polite">
            운동 <strong>{p.items.length}</strong>개
          </span>
          <button
            className={`favorite-filter ${p.onlyFavorites ? "active" : ""}`}
            aria-pressed={p.onlyFavorites}
            onClick={p.onOnlyFavorites}
          >
            <Star size={14} />
            즐겨찾기
          </button>
        </div>
      </div>
      <div className="exercise-rows" ref={rows}>
        {p.items.length ? (
          p.items.map((item) => (
            <div
              key={item.id}
              className={`exercise-row ${p.selectedId === item.id ? "selected" : ""}`}
            >
              <button
                className="row-select"
                onClick={() => p.onSelect(item.id)}
                aria-pressed={p.selectedId === item.id}
              >
                <span className="exercise-symbol">
                  <img src={`${import.meta.env.BASE_URL}${exerciseMedia(item.id).poster}`} alt="" loading="lazy" decoding="async" width="64" height="64" />
                </span>
                <span className="row-copy">
                  <strong>{item.name}</strong>
                  <span>{item.englishName}</span>
                </span>
                <ArrowUpRight className="row-arrow" size={16} />
              </button>
              <button
                className={`star-button ${p.favorites.includes(item.id) ? "is-favorite" : ""}`}
                aria-label={`${item.name} 즐겨찾기`}
                aria-pressed={p.favorites.includes(item.id)}
                onClick={() => p.onFavorite(item.id)}
              >
                <Star size={19} />
              </button>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <Search size={28} />
            <h3>조건에 맞는 운동이 없어요</h3>
            <p>이름이나 기구 조건을 바꿔보세요.</p>
            <button className="button" onClick={p.reset}>
              필터 초기화
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
