import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode, RefObject } from 'react';
import type { HeatWeek, MuscleLoad, ProgressSession, WeekBucket } from './stats';
import { UNDERTRAINED_SETS_PER_WEEK } from './stats';

/* ---------- formatting ---------- */

const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'];

export function formatNumber(value: number, maxFractionDigits = 0): string {
  return value.toLocaleString('ko-KR', { maximumFractionDigits: maxFractionDigits });
}

/** "2026-11-03" → "11월 3일" */
export function formatDate(key: string): string {
  const [, month, day] = key.split('-').map(Number);
  return `${month}월 ${day}일`;
}

/** "2026-11-03" → "11/3" */
export function formatShortDate(key: string): string {
  const [, month, day] = key.split('-').map(Number);
  return `${month}/${day}`;
}

function compactKg(value: number): string {
  if (value >= 10000) return `${formatNumber(value / 10000, 1)}만`;
  return formatNumber(value);
}

/* ---------- measured width, so SVG text keeps a constant size ---------- */

export function useElementWidth<T extends HTMLElement>(fallback = 320): [RefObject<T | null>, number] {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const apply = (w: number) => {
      if (w > 0) setWidth(Math.round(w));
    };
    apply(node.getBoundingClientRect().width);
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) apply(entry.contentRect.width);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}

/* ---------- card with a chart / table toggle ---------- */

interface ChartCardProps {
  title: string;
  note?: ReactNode;
  /** Render function receives the measured inner width in px. */
  chart: (width: number) => ReactNode;
  table: ReactNode;
  /** Rendered above the chart (controls, key figures). */
  lead?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function ChartCard({ title, note, chart, table, lead, children, className }: ChartCardProps) {
  const [showTable, setShowTable] = useState(false);
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const headingId = useId();
  return (
    <section className={`ins-card${className ? ` ${className}` : ''}`} aria-labelledby={headingId}>
      <div className="ins-card-head">
        <h3 id={headingId} className="ins-card-title">{title}</h3>
        <button type="button" className="ins-toggle" aria-pressed={showTable} onClick={() => setShowTable((v) => !v)}>
          {showTable ? '차트로 보기' : '표로 보기'}
        </button>
      </div>
      {note ? <p className="ins-note">{note}</p> : null}
      {lead}
      <div ref={ref} className="ins-chart-slot">
        {showTable ? <div className="ins-table-wrap" tabIndex={0} role="region" aria-label={`${title} 표`}>{table}</div> : chart(width)}
      </div>
      {children}
    </section>
  );
}

/* ---------- 12-week heatmap ---------- */

const HEAT_LABELS = ['쉬는 날', '1–9세트', '10–19세트', '20세트 이상'];

function HeatCell({ x, y, size, level }: { x: number; y: number; size: number; level: number }) {
  const inner = size * 0.36;
  return (
    <>
      <rect x={x} y={y} width={size} height={size} rx={3} className={`ins-heat ins-heat-${level}`} />
      {level === 3 ? (
        <rect x={x + (size - inner) / 2} y={y + (size - inner) / 2} width={inner} height={inner} rx={1.5} className="ins-heat-mark" />
      ) : null}
    </>
  );
}

export function HeatmapChart({ weeks, width, activeDays }: { weeks: HeatWeek[]; width: number; activeDays: number }) {
  const titleId = useId();
  const descId = useId();
  const labelW = 20;
  const top = 18;
  const gap = 3;
  const cols = Math.max(1, weeks.length);
  const cell = Math.max(10, Math.min(26, (width - labelW - gap * (cols - 1)) / cols));
  const svgW = labelW + cols * cell + (cols - 1) * gap;
  const svgH = top + 7 * cell + 6 * gap + 2;
  let lastMonth = '';
  return (
    <div className="ins-heat-wrap">
      <svg className="ins-svg" width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} role="img" aria-labelledby={`${titleId} ${descId}`}>
        <title id={titleId}>{`최근 ${cols}주 운동일 히트맵`}</title>
        <desc id={descId}>
          최근 {cols}주 동안 {activeDays}일 운동했어요. 세로는 월요일부터 일요일, 가로는 주 단위이며 칸이 진할수록 세트 수가 많아요.
        </desc>
        {[0, 2, 4, 6].map((d) => (
          <text key={d} x={0} y={top + d * (cell + gap) + cell / 2} className="ins-axis" dominantBaseline="central">
            {WEEKDAYS[d]}
          </text>
        ))}
        {weeks.map((week, w) => {
          const x = labelW + w * (cell + gap);
          const month = week.weekStart.slice(5, 7);
          const showMonth = month !== lastMonth;
          lastMonth = month;
          return (
            <g key={week.weekStart}>
              {showMonth ? (
                <text x={x} y={10} className="ins-axis">{Number(month)}월</text>
              ) : null}
              {week.days.map((day, d) => {
                if (day.isFuture) return null;
                const y = top + d * (cell + gap);
                return (
                  <g key={day.date}>
                    <title>{`${formatDate(day.date)} (${WEEKDAYS[day.weekday]}): ${day.sets > 0 ? `${formatNumber(day.sets, 1)}세트` : '기록 없음'}`}</title>
                    <HeatCell x={x} y={y} size={cell} level={day.level} />
                    {day.isToday ? <rect x={x - 1} y={y - 1} width={cell + 2} height={cell + 2} rx={4} className="ins-heat-today" /> : null}
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
      <ul className="ins-legend" aria-label="히트맵 범례">
        {HEAT_LABELS.map((label, level) => (
          <li key={label}>
            <svg width={14} height={14} viewBox="0 0 14 14" aria-hidden="true" focusable="false">
              <HeatCell x={0.5} y={0.5} size={13} level={level} />
            </svg>
            {label}
          </li>
        ))}
        <li>
          <svg width={16} height={16} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <rect x={2} y={2} width={12} height={12} rx={3} className="ins-heat ins-heat-0" />
            <rect x={1} y={1} width={14} height={14} rx={4} className="ins-heat-today" />
          </svg>
          오늘
        </li>
      </ul>
    </div>
  );
}

export function HeatmapTable({ weeks }: { weeks: HeatWeek[] }) {
  return (
    <table className="ins-table">
      <caption className="ins-sr">주별 운동일과 세트 수</caption>
      <thead>
        <tr>
          <th scope="col">주 시작일</th>
          <th scope="col">운동일</th>
          <th scope="col">세트</th>
          <th scope="col">운동한 요일</th>
        </tr>
      </thead>
      <tbody>
        {[...weeks].reverse().map((week) => (
          <tr key={week.weekStart}>
            <th scope="row">{formatDate(week.weekStart)}</th>
            <td>{week.workoutDays}일</td>
            <td>{formatNumber(week.totalSets, 1)}</td>
            <td>{week.days.filter((d) => d.sets > 0).map((d) => WEEKDAYS[d.weekday]).join(' · ') || '–'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ---------- weekly volume bars ---------- */

export function VolumeBarChart({ buckets, width }: { buckets: WeekBucket[]; width: number }) {
  const titleId = useId();
  const descId = useId();
  const height = 190;
  const top = 20;
  const bottom = 34;
  const plotH = height - top - bottom;
  const n = Math.max(1, buckets.length);
  const slot = width / n;
  const barW = Math.max(8, Math.min(44, slot * 0.62));
  const max = Math.max(1, ...buckets.map((b) => b.volumeKg));
  const best = buckets.reduce((a, b) => (b.volumeKg > a.volumeKg ? b : a), buckets[0]);
  const current = buckets[buckets.length - 1];
  return (
    <svg className="ins-svg" width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby={`${titleId} ${descId}`}>
      <title id={titleId}>{`최근 ${n}주 주간 볼륨 막대 차트`}</title>
      <desc id={descId}>
        {best && best.volumeKg > 0
          ? `가장 높은 주는 ${formatDate(best.weekStart)} 주의 ${formatNumber(best.volumeKg)}kg이고, 이번 주는 지금까지 ${formatNumber(current.volumeKg)}kg이에요.`
          : '이 기간에는 볼륨 기록이 없어요.'}
      </desc>
      <line x1={0} x2={width} y1={top + plotH} y2={top + plotH} className="ins-baseline" />
      {buckets.map((bucket, i) => {
        const h = bucket.volumeKg > 0 ? Math.max(3, (bucket.volumeKg / max) * plotH) : 0;
        const cx = slot * i + slot / 2;
        const y = top + plotH - h;
        return (
          <g key={bucket.weekStart}>
            <title>{`${formatDate(bucket.weekStart)} 주: ${formatNumber(bucket.volumeKg)}kg, ${formatNumber(bucket.totalSets, 1)}세트`}</title>
            {h > 0 ? (
              <rect x={cx - barW / 2} y={y} width={barW} height={h} rx={3} className={`ins-bar${bucket.isCurrent ? ' ins-bar-current' : ''}`} />
            ) : (
              <line x1={cx - barW / 2} x2={cx + barW / 2} y1={top + plotH - 1} y2={top + plotH - 1} className="ins-bar-zero" />
            )}
            <text x={cx} y={y - 6} textAnchor="middle" className="ins-value">
              {bucket.volumeKg > 0 ? compactKg(bucket.volumeKg) : '0'}
            </text>
            <text x={cx} y={height - 18} textAnchor="middle" className={`ins-axis${bucket.isCurrent ? ' ins-axis-strong' : ''}`}>
              {formatShortDate(bucket.weekStart)}
            </text>
            {bucket.isCurrent ? (
              <text x={cx} y={height - 4} textAnchor="middle" className="ins-axis ins-axis-strong">이번 주</text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

export function VolumeTable({ buckets }: { buckets: WeekBucket[] }) {
  return (
    <table className="ins-table">
      <caption className="ins-sr">주간 볼륨</caption>
      <thead>
        <tr>
          <th scope="col">주 시작일</th>
          <th scope="col">볼륨(kg)</th>
          <th scope="col">세트</th>
          <th scope="col">운동일</th>
        </tr>
      </thead>
      <tbody>
        {[...buckets].reverse().map((b) => (
          <tr key={b.weekStart}>
            <th scope="row">
              {formatDate(b.weekStart)}
              {b.isCurrent ? ' (이번 주)' : ''}
            </th>
            <td>{formatNumber(b.volumeKg)}</td>
            <td>{formatNumber(b.totalSets, 1)}</td>
            <td>{b.workoutDays}일</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ---------- muscle distribution ---------- */

export function MuscleBarChart({ items, width }: { items: MuscleLoad[]; width: number }) {
  const titleId = useId();
  const descId = useId();
  const rowH = 26;
  const top = 22;
  const labelW = 76;
  const valueW = 82;
  const plotW = Math.max(40, width - labelW - valueW);
  const height = top + items.length * rowH + 4;
  const max = Math.max(UNDERTRAINED_SETS_PER_WEEK * 1.5, ...items.map((i) => i.setsPerWeek));
  const thresholdX = labelW + (UNDERTRAINED_SETS_PER_WEEK / max) * plotW;
  const low = items.filter((i) => i.undertrained).map((i) => i.name);
  return (
    <svg className="ins-svg" width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby={`${titleId} ${descId}`}>
      <title id={titleId}>최근 4주 부위별 주당 세트 수</title>
      <desc id={descId}>
        주동근은 세트당 1, 보조근은 0.5로 계산한 주당 평균이에요.{' '}
        {low.length > 0 ? `주 ${UNDERTRAINED_SETS_PER_WEEK}세트보다 적은 부위: ${low.join(', ')}.` : `모든 부위가 주 ${UNDERTRAINED_SETS_PER_WEEK}세트 이상이에요.`}
      </desc>
      <line x1={thresholdX} x2={thresholdX} y1={top - 4} y2={height - 2} className="ins-threshold" />
      <text x={thresholdX} y={10} textAnchor="middle" className="ins-axis">주 {UNDERTRAINED_SETS_PER_WEEK}세트</text>
      {items.map((item, i) => {
        const y = top + i * rowH;
        const w = item.setsPerWeek > 0 ? Math.max(3, (item.setsPerWeek / max) * plotW) : 0;
        return (
          <g key={item.muscleId}>
            <text x={0} y={y + rowH / 2} dominantBaseline="central" className="ins-row-label">{item.name}</text>
            {w > 0 ? (
              <rect x={labelW} y={y + 5} width={w} height={rowH - 10} rx={3} className={`ins-bar${item.undertrained ? ' ins-bar-low' : ''}`} />
            ) : (
              <line x1={labelW} x2={labelW} y1={y + 5} y2={y + rowH - 5} className="ins-bar-zero" />
            )}
            <text x={width} y={y + rowH / 2} textAnchor="end" dominantBaseline="central" className="ins-value">
              {formatNumber(item.setsPerWeek, 1)}세트{item.undertrained ? ' · 부족' : ''}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function MuscleTable({ items }: { items: MuscleLoad[] }) {
  return (
    <table className="ins-table">
      <caption className="ins-sr">부위별 세트 분포</caption>
      <thead>
        <tr>
          <th scope="col">부위</th>
          <th scope="col">주당 세트</th>
          <th scope="col">4주 합계</th>
          <th scope="col">비중</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.muscleId}>
            <th scope="row">{item.name}</th>
            <td>
              {formatNumber(item.setsPerWeek, 1)}
              {item.undertrained ? ' (부족)' : ''}
            </td>
            <td>{formatNumber(item.weightedSets, 1)}</td>
            <td>{formatNumber(item.share * 100)}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ---------- e1RM line chart ---------- */

export function E1rmLineChart({ sessions, width, exerciseName }: { sessions: ProgressSession[]; width: number; exerciseName: string }) {
  const titleId = useId();
  const descId = useId();
  const points = sessions.filter((s): s is ProgressSession & { bestE1rm: number } => s.bestE1rm !== null);
  const height = 210;
  const left = 38;
  const right = 16;
  const top = 24;
  const bottom = 26;
  const plotW = Math.max(10, width - left - right);
  const plotH = height - top - bottom;
  const values = points.map((p) => p.bestE1rm);
  let lo = Math.min(...values);
  let hi = Math.max(...values);
  if (hi - lo < 1) {
    lo -= 5;
    hi += 5;
  } else {
    const pad = (hi - lo) * 0.15;
    lo -= pad;
    hi += pad;
  }
  lo = Math.max(0, lo);
  const xOf = (i: number) => (points.length === 1 ? left + plotW / 2 : left + (i / (points.length - 1)) * plotW);
  const yOf = (v: number) => top + plotH - ((v - lo) / (hi - lo)) * plotH;
  const ticks = [lo, (lo + hi) / 2, hi];
  const first = points[0];
  const last = points[points.length - 1];
  const labelEvery = Math.max(1, Math.ceil(points.length / Math.max(2, Math.floor(plotW / 56))));
  const stepPx = points.length > 1 ? plotW / (points.length - 1) : plotW;
  const showValues = points.length <= Math.max(3, Math.floor(plotW / 44));
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xOf(i).toFixed(1)} ${yOf(p.bestE1rm).toFixed(1)}`).join(' ');
  return (
    <svg className="ins-svg" width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby={`${titleId} ${descId}`}>
      <title id={titleId}>{`${exerciseName} 세션별 최고 추정 1RM 선 차트`}</title>
      <desc id={descId}>
        {formatDate(first.date)} {formatNumber(first.bestE1rm, 1)}kg에서 {formatDate(last.date)} {formatNumber(last.bestE1rm, 1)}kg까지 {points.length}개 세션의 기록이에요. 신기록 세션은 마름모와 PR 글자로 표시돼요.
      </desc>
      {ticks.map((tick) => (
        <g key={tick}>
          <line x1={left} x2={width - right} y1={yOf(tick)} y2={yOf(tick)} className="ins-grid" />
          <text x={left - 6} y={yOf(tick)} textAnchor="end" dominantBaseline="central" className="ins-axis">{formatNumber(tick)}</text>
        </g>
      ))}
      {points.length > 1 ? <path d={path} className="ins-line" /> : null}
      {points.map((p, i) => {
        const x = xOf(i);
        const y = yOf(p.bestE1rm);
        const isLast = i === points.length - 1;
        return (
          <g key={p.date}>
            <title>{`${formatDate(p.date)}: ${formatNumber(p.bestE1rm, 1)}kg${p.isPr ? ' (신기록)' : ''}`}</title>
            {p.isPr ? (
              <rect x={x - 5} y={y - 5} width={10} height={10} transform={`rotate(45 ${x} ${y})`} className="ins-point-pr" />
            ) : (
              <circle cx={x} cy={y} r={4} className="ins-point" />
            )}
            {showValues || isLast ? (
              <text x={x} y={y - 10} textAnchor={points.length === 1 ? 'middle' : isLast ? 'end' : i === 0 ? 'start' : 'middle'} className="ins-value">
                {p.isPr ? 'PR ' : ''}
                {formatNumber(p.bestE1rm, 1)}
              </text>
            ) : p.isPr ? (
              <text x={x} y={y - 10} textAnchor="middle" className="ins-value">PR</text>
            ) : null}
            {isLast || (i % labelEvery === 0 && (points.length - 1 - i) * stepPx >= 44) ? (
              <text x={x} y={height - 6} textAnchor={points.length === 1 ? 'middle' : isLast ? 'end' : i === 0 ? 'start' : 'middle'} className="ins-axis">
                {formatShortDate(p.date)}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

export function SessionTable({ sessions }: { sessions: ProgressSession[] }) {
  return (
    <table className="ins-table">
      <caption className="ins-sr">세션별 기록</caption>
      <thead>
        <tr>
          <th scope="col">날짜</th>
          <th scope="col">최고 세트</th>
          <th scope="col">추정 1RM</th>
          <th scope="col">볼륨(kg)</th>
        </tr>
      </thead>
      <tbody>
        {[...sessions].reverse().map((s) => (
          <tr key={s.date}>
            <th scope="row">{formatDate(s.date)}</th>
            <td>{s.bestSet ? `${formatNumber(s.bestSet.weightKg, 2)}kg × ${formatNumber(s.bestSet.reps)}회` : '–'}</td>
            <td>
              {s.bestE1rm !== null ? `${formatNumber(s.bestE1rm, 1)}kg` : '–'}
              {s.isPr ? ' · PR' : ''}
            </td>
            <td>{formatNumber(s.volumeKg)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
