import { useId, useMemo, useState } from 'react';
import type { Exercise, MuscleId } from '../../data/exercises';
import {
  ChartCard,
  E1rmLineChart,
  HeatmapChart,
  HeatmapTable,
  MuscleBarChart,
  MuscleTable,
  SessionTable,
  VolumeBarChart,
  VolumeTable,
  formatDate,
  formatNumber,
} from './charts';
import {
  UNDERTRAINED_SETS_PER_WEEK,
  compareWeeks,
  exerciseProgress,
  loggedExercises,
  muscleDistribution,
  normalizeLogs,
  trainingHeatmap,
  trainingStreaks,
  weeklyVolume,
} from './stats';
import type { LogEntry } from './stats';
import './insights.css';

export interface InsightsPanelProps {
  logs: LogEntry[];
  exercises: Exercise[];
  muscles: { id: MuscleId; name: string }[];
  /** Overrides "today" (defaults to the current local date). Mainly for tests and demos. */
  now?: Date;
  /** When provided, the empty state shows a button that calls it. */
  onStartLogging?: () => void;
  className?: string;
}

const CHART_SESSION_LIMIT = 24;

function Delta({ value, unit, digits = 0 }: { value: number; unit: string; digits?: number }) {
  if (value === 0) return <span className="ins-delta">― 지난주와 같아요</span>;
  const up = value > 0;
  return (
    <span className={`ins-delta ${up ? 'ins-delta-up' : 'ins-delta-down'}`}>
      <span aria-hidden="true">{up ? '▲' : '▼'}</span> 지난주보다 {up ? '+' : '−'}
      {formatNumber(Math.abs(value), digits)}
      {unit}
    </span>
  );
}

export function InsightsPanel({ logs, exercises, muscles, now, onStartLogging, className }: InsightsPanelProps) {
  const headingId = useId();
  const selectId = useId();
  // Recomputed per render on purpose: a `new Date()` default must not be frozen by memoisation.
  const dayKey = (now ?? new Date()).toDateString();

  const stats = useMemo(() => {
    const at = now ?? new Date();
    return {
      validCount: normalizeLogs(logs).length,
      week: compareWeeks(logs, at),
      heatmap: trainingHeatmap(logs, at, 12),
      streaks: trainingStreaks(logs, at),
      volume: weeklyVolume(logs, at, 8),
      distribution: muscleDistribution(logs, exercises, muscles, at, 4),
      picker: loggedExercises(logs, exercises),
    };
  }, [logs, exercises, muscles, dayKey]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const activeId = stats.picker.some((p) => p.exerciseId === selectedId) ? selectedId : (stats.picker[0]?.exerciseId ?? null);
  const progress = useMemo(() => (activeId ? exerciseProgress(logs, activeId) : null), [logs, activeId]);
  const activeName = stats.picker.find((p) => p.exerciseId === activeId)?.name ?? '삭제된 운동';

  const rootClass = `ins-root${className ? ` ${className}` : ''}`;

  if (stats.validCount === 0) {
    return (
      <section className={rootClass} aria-labelledby={headingId}>
        <div className="ins-empty">
          <svg className="ins-empty-art" width={96} height={64} viewBox="0 0 96 64" aria-hidden="true" focusable="false">
            <line x1={6} x2={90} y1={56} y2={56} className="ins-baseline" />
            <rect x={14} y={38} width={14} height={18} rx={3} className="ins-bar ins-bar-low" />
            <rect x={41} y={26} width={14} height={30} rx={3} className="ins-bar ins-bar-low" />
            <rect x={68} y={10} width={14} height={46} rx={3} className="ins-bar" />
          </svg>
          <h2 id={headingId} className="ins-empty-title">아직 기록이 없어요</h2>
          <p className="ins-empty-text">운동을 기록하면 주간 요약, 운동일 히트맵, 부위별 균형과 성장 그래프가 여기에 나타나요.</p>
          {onStartLogging ? (
            <button type="button" className="ins-button" onClick={onStartLogging}>
              첫 운동 기록하기
            </button>
          ) : null}
        </div>
      </section>
    );
  }

  const { week, heatmap, streaks, volume, distribution } = stats;
  const tiles = [
    { label: '운동일', value: week.thisWeek.workoutDays, last: week.lastWeek.workoutDays, delta: week.delta.workoutDays, unit: '일', digits: 0 },
    { label: '총 세트', value: week.thisWeek.totalSets, last: week.lastWeek.totalSets, delta: week.delta.totalSets, unit: '세트', digits: 1 },
    { label: '볼륨', value: week.thisWeek.volumeKg, last: week.lastWeek.volumeKg, delta: week.delta.volumeKg, unit: 'kg', digits: 0 },
  ];
  const lowNames = distribution.undertrained.map((m) => m.name);
  const chartSessions = progress ? progress.sessions.filter((s) => s.bestE1rm !== null).slice(-CHART_SESSION_LIMIT) : [];
  const estimatedCount = progress ? progress.sessions.filter((s) => s.bestE1rm !== null).length : 0;

  return (
    <section className={rootClass} aria-labelledby={headingId}>
      <header className="ins-header">
        <h2 id={headingId} className="ins-title">인사이트</h2>
        <p className="ins-sub">기록을 바탕으로 이번 주 흐름과 성장을 정리했어요.</p>
      </header>

      <section className="ins-block" aria-label="이번 주와 지난주 비교">
        <h3 className="ins-block-title">
          이번 주 <span className="ins-block-meta">{formatDate(week.thisWeekStart)}부터 · 지난주 전체와 비교</span>
        </h3>
        <dl className="ins-tiles">
          {tiles.map((tile) => (
            <div key={tile.label} className="ins-tile">
              <dt className="ins-tile-label">{tile.label}</dt>
              <dd className="ins-tile-value">
                {formatNumber(tile.value, tile.digits)}
                <span className="ins-tile-unit">{tile.unit}</span>
              </dd>
              <dd className="ins-tile-foot">
                <Delta value={tile.delta} unit={tile.unit} digits={tile.digits} />
                <span className="ins-tile-last">
                  지난주 {formatNumber(tile.last, tile.digits)}
                  {tile.unit}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="ins-grid-2">
        <ChartCard
          title="12주 운동일"
          chart={(width) => <HeatmapChart weeks={heatmap.weeks} width={width} activeDays={heatmap.activeDays} />}
          table={<HeatmapTable weeks={heatmap.weeks} />}
        >
          <dl className="ins-streaks">
            <div>
              <dt>연속 운동</dt>
              <dd>{streaks.currentDays}일</dd>
            </div>
            <div>
              <dt>최장 연속</dt>
              <dd>{streaks.longestDays}일</dd>
            </div>
            <div>
              <dt>연속 주</dt>
              <dd>{streaks.currentWeeks}주</dd>
            </div>
            <div>
              <dt>12주 운동일</dt>
              <dd>{heatmap.activeDays}일</dd>
            </div>
          </dl>
        </ChartCard>

        <ChartCard
          title="주간 볼륨"
          note="최근 8주 · 세트 × 횟수 × 중량 (kg)"
          chart={(width) => <VolumeBarChart buckets={volume} width={width} />}
          table={<VolumeTable buckets={volume} />}
        />
      </div>

      <ChartCard
        title="부위별 세트 분포"
        note={`최근 4주 주당 평균 · 주동근 1세트, 보조근 0.5세트로 계산 (${formatDate(distribution.windowStart)}–${formatDate(distribution.windowEnd)})`}
        chart={(width) =>
          distribution.hasData ? (
            <MuscleBarChart items={distribution.items} width={Math.min(width, 640)} />
          ) : (
            <p className="ins-placeholder">최근 4주 동안 부위를 알 수 있는 기록이 없어요.</p>
          )
        }
        table={<MuscleTable items={distribution.items} />}
      >
        {distribution.hasData ? (
          <div className="ins-hint" role="note">
            {lowNames.length > 0 ? (
              <p>
                <strong>{lowNames.join(', ')}</strong> 부위는 최근 주당 {UNDERTRAINED_SETS_PER_WEEK}세트에 조금 못 미쳤어요. 다음 루틴에 한두 세트 더해 보는 건 어떨까요?
              </p>
            ) : (
              <p>모든 부위를 주당 {UNDERTRAINED_SETS_PER_WEEK}세트 이상 고르게 자극하고 있어요. 지금 흐름을 이어가 보세요.</p>
            )}
            <p className="ins-hint-fine">일반적인 운동 참고용 안내이며 의학적 조언이 아니에요. 목표와 몸 상태에 맞게 조절하세요.</p>
          </div>
        ) : null}
        {distribution.unmatchedSets > 0 ? (
          <p className="ins-note">목록에 없는 운동 {formatNumber(distribution.unmatchedSets, 1)}세트는 부위 계산에서 빠졌어요.</p>
        ) : null}
      </ChartCard>

      {progress && activeId ? (
        <ChartCard
          title="운동별 성장"
          note="추정 1RM은 Epley 공식(중량 × (1 + 횟수 ÷ 30))으로, 12회 이하이고 중량이 있는 세트만 계산해요."
          chart={(width) =>
            chartSessions.length > 0 ? (
              <>
                <E1rmLineChart sessions={chartSessions} width={Math.min(width, 760)} exerciseName={activeName} />
                {estimatedCount > chartSessions.length ? (
                  <p className="ins-note">최근 {chartSessions.length}개 세션만 그렸어요. 전체 기록은 표에서 볼 수 있어요.</p>
                ) : null}
              </>
            ) : (
              <p className="ins-placeholder">이 운동은 추정 1RM을 계산할 기록이 아직 없어요. 중량을 넣고 12회 이하로 기록하면 그래프가 그려져요.</p>
            )
          }
          table={<SessionTable sessions={progress.sessions} />}
          lead={
            <div className="ins-progress-head">
              <div className="ins-field">
                <label htmlFor={selectId}>운동 선택</label>
                <select id={selectId} className="ins-select" value={activeId} onChange={(e) => setSelectedId(e.target.value)}>
                  {stats.picker.map((p) => (
                    <option key={p.exerciseId} value={p.exerciseId}>
                      {p.name ?? '삭제된 운동'} ({p.sessions}회)
                    </option>
                  ))}
                </select>
              </div>
              <div className="ins-best" aria-live="polite">
                <span className="ins-best-label">최고 추정 1RM</span>
                <span className="ins-best-value">
                  {progress.bestE1rm ? (
                    <>
                      {formatNumber(progress.bestE1rm.value, 1)}
                      <span className="ins-tile-unit">kg</span>
                    </>
                  ) : (
                    '–'
                  )}
                </span>
                {progress.bestE1rm ? <span className="ins-best-date">{formatDate(progress.bestE1rm.date)}</span> : null}
              </div>
            </div>
          }
        >
          <ul className="ins-badges" aria-label="개인 기록">
            {progress.latestIsPr ? (
              <li className="ins-badge ins-badge-new">
                <span aria-hidden="true">★</span> 최근 세션 신기록
              </li>
            ) : null}
            {progress.prCount > 0 ? <li className="ins-badge">PR {progress.prCount}회 갱신</li> : null}
            {progress.heaviest ? (
              <li className="ins-badge">
                최고 중량 {formatNumber(progress.heaviest.value, 2)}kg · {formatDate(progress.heaviest.date)}
              </li>
            ) : null}
            {progress.bestVolume ? (
              <li className="ins-badge">
                최대 볼륨 {formatNumber(progress.bestVolume.value)}kg · {formatDate(progress.bestVolume.date)}
              </li>
            ) : null}
            {!progress.heaviest && !progress.bestVolume ? <li className="ins-badge ins-badge-plain">중량 기록이 쌓이면 개인 기록이 표시돼요</li> : null}
          </ul>
        </ChartCard>
      ) : null}
    </section>
  );
}

export default InsightsPanel;
