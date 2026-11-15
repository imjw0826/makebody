import { useEffect, useRef, useState } from "react";
import { Search, Star, ArrowUpRight, LayoutGrid, List, ChevronLeft, ChevronRight } from "lucide-react";
import { exerciseMedia } from "./ExerciseAnimation";
import type { Exercise } from "../data/exercises";
interface Props {
  view: "list" | "grid";
  onView: (view: "list" | "grid") => void;
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
  const [page, setPage] = useState(0);
  const filterKey = p.items.map(item => item.id).join(",");
  const pageCount = Math.max(1, Math.ceil(p.items.length / 12));
  const currentPage = Math.min(page, pageCount - 1);
  const visibleItems = p.view === "grid" ? p.items.slice(currentPage * 12, (currentPage + 1) * 12) : p.items;
  useEffect(() => { setPage(0); }, [filterKey]);
  useEffect(() => {
    if (p.view !== "list") return;
    const selected = rows.current?.querySelector<HTMLElement>(".selected");
    if (rows.current && selected) rows.current.scrollTop = Math.max(0, selected.offsetTop - 80);
  }, [p.selectedId, p.items.length, p.view]);
  return (
    <section className={`exercise-list panel ${p.view === "grid" ? "exercise-list--grid" : ""}`} aria-label="운동 목록">
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
        <div className="view-switch" role="group" aria-label="운동 목록 보기 방식">
          <button aria-label="격자 보기" aria-pressed={p.view === "grid"} onClick={() => p.onView("grid")}><LayoutGrid size={15} />격자</button>
          <button aria-label="목록 보기" aria-pressed={p.view === "list"} onClick={() => p.onView("list")}><List size={15} />목록</button>
        </div>
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
          visibleItems.map((item) => (
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
      {p.view === "grid" && p.items.length > 0 && <nav className="grid-pagination" aria-label="운동 목록 페이지">
        <button className="button" aria-label="이전 운동 페이지" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}><ChevronLeft size={15} />이전</button>
        <span aria-live="polite">{currentPage + 1} / {pageCount}</span>
        <button className="button" aria-label="다음 운동 페이지" disabled={currentPage + 1 >= pageCount} onClick={() => setPage(currentPage + 1)}>다음<ChevronRight size={15} /></button>
      </nav>}
    </section>
  );
}
