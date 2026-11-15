import { useId, useState } from 'react';
import { BAR_OPTIONS_KG, PLATE_OPTIONS_KG, solvePlates } from './calc';
import type { PlateResult } from './calc';
import './tools.css';

export interface PlateCalculatorProps {
  defaultTargetKg?: number;
  /** 20, 15 or 10 (default 20). */
  defaultBarKg?: number;
  className?: string;
}

const MAX_TARGET_KG = 500;

function format(value: number): string {
  return value.toLocaleString('ko-KR', { maximumFractionDigits: 2 });
}

/** Plate height in the drawing; heavier plates are taller. */
function plateHeight(kg: number): number {
  if (kg >= 25) return 104;
  if (kg >= 20) return 96;
  if (kg >= 15) return 84;
  if (kg >= 10) return 70;
  if (kg >= 5) return 54;
  if (kg >= 2.5) return 42;
  return 34;
}

function BarDrawing({ result }: { result: PlateResult }) {
  const titleId = useId();
  const descId = useId();
  const plates = result.perSide.flatMap((stack) => Array.from({ length: stack.count }, () => stack.plateKg));
  const plateW = 26;
  const gap = 3;
  const shaftW = 46;
  const collarW = 8;
  const platesW = plates.length * (plateW + gap);
  const sleeveW = Math.max(120, platesW + 34);
  const width = Math.max(300, shaftW + collarW + sleeveW + 6);
  const height = 140;
  const cy = 62;
  const sleeveX = shaftW + collarW;
  const summary = plates.length > 0 ? result.perSide.map((s) => `${format(s.plateKg)}kg ${s.count}장`).join(', ') : '원판 없음';
  return (
    <svg className="tl-bar-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby={`${titleId} ${descId}`}>
      <title id={titleId}>바벨 한쪽 원판 배치</title>
      <desc id={descId}>
        {format(result.barKg)}kg 바의 한쪽에 안쪽부터 {summary}. 반대쪽도 똑같이 끼워요.
      </desc>
      <rect x={0} y={cy - 4} width={shaftW} height={8} className="tl-bar-shaft" />
      <rect x={shaftW} y={cy - 14} width={collarW} height={28} rx={2} className="tl-bar-collar" />
      <rect x={sleeveX} y={cy - 7} width={sleeveW} height={14} rx={2} className="tl-bar-sleeve" />
      {plates.map((kg, i) => {
        const h = plateHeight(kg);
        const x = sleeveX + 2 + i * (plateW + gap);
        return (
          <g key={`${kg}-${i}`}>
            <rect x={x} y={cy - h / 2} width={plateW} height={h} rx={4} className="tl-plate" />
            <text x={x + plateW / 2} y={cy + 70} textAnchor="middle" className="tl-plate-label">
              {format(kg)}
            </text>
          </g>
        );
      })}
      {plates.length === 0 ? (
        <text x={sleeveX + sleeveW / 2} y={cy + 40} textAnchor="middle" className="tl-plate-label">빈 바</text>
      ) : null}
      <text x={0} y={cy - 22} className="tl-bar-caption">바 {format(result.barKg)}kg</text>
    </svg>
  );
}

export function PlateCalculator({ defaultTargetKg, defaultBarKg = 20, className }: PlateCalculatorProps) {
  const [target, setTarget] = useState(defaultTargetKg && defaultTargetKg > 0 ? String(defaultTargetKg) : '');
  const [barKg, setBarKg] = useState<number>(BAR_OPTIONS_KG.some((b) => b === defaultBarKg) ? defaultBarKg : 20);
  const [enabled, setEnabled] = useState<number[]>([...PLATE_OPTIONS_KG]);
  const headingId = useId();
  const targetId = useId();
  const helpId = useId();

  const value = Number(target);
  const filled = target.trim() !== '';
  const inRange = filled && Number.isFinite(value) && value > 0 && value <= MAX_TARGET_KG;
  const tooLight = inRange && value < barKg;
  const result = inRange && !tooLight ? solvePlates(value, barKg, enabled) : null;

  const togglePlate = (kg: number) => {
    setEnabled((list) => (list.includes(kg) ? list.filter((p) => p !== kg) : [...list, kg]));
  };

  let help = '바와 원판을 합친 총 중량을 입력하세요.';
  let warn = false;
  if (filled && !inRange) {
    help = `0보다 크고 ${MAX_TARGET_KG}kg 이하인 숫자로 입력해 주세요.`;
    warn = true;
  } else if (tooLight) {
    help = `목표 중량이 바 무게(${format(barKg)}kg)보다 가벼워요. 더 가벼운 바를 고르거나 목표를 높여 보세요.`;
    warn = true;
  }

  return (
    <section className={`tl-root tl-plates${className ? ` ${className}` : ''}`} aria-labelledby={headingId}>
      <h3 id={headingId} className="tl-title">원판 계산기</h3>

      <div className="tl-field">
        <label htmlFor={targetId}>목표 중량 (kg)</label>
        <input
          id={targetId}
          className="tl-input"
          type="number"
          inputMode="decimal"
          min={0}
          max={MAX_TARGET_KG}
          step={2.5}
          placeholder="예: 100"
          value={target}
          aria-describedby={helpId}
          aria-invalid={warn}
          onChange={(e) => setTarget(e.target.value)}
        />
        <p id={helpId} className={`tl-help${warn ? ' tl-help-warn' : ''}`} aria-live="polite">{help}</p>
      </div>

      <fieldset className="tl-fieldset">
        <legend>바 무게</legend>
        <div className="tl-group">
          {BAR_OPTIONS_KG.map((kg) => (
            <label key={kg} className="tl-option">
              <input type="radio" name={`${headingId}-bar`} checked={barKg === kg} onChange={() => setBarKg(kg)} />
              <span>{kg}kg</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="tl-fieldset">
        <legend>사용할 원판</legend>
        <div className="tl-group">
          {PLATE_OPTIONS_KG.map((kg) => (
            <label key={kg} className="tl-option">
              <input type="checkbox" checked={enabled.includes(kg)} onChange={() => togglePlate(kg)} />
              <span>{format(kg)}kg</span>
            </label>
          ))}
        </div>
      </fieldset>

      {result ? (
        <div className="tl-plate-result" aria-live="polite">
          {enabled.length === 0 ? (
            <p className="tl-callout">사용할 원판을 하나 이상 골라 주세요. 지금은 빈 바({format(barKg)}kg)만 들 수 있어요.</p>
          ) : result.exact ? (
            <p className="tl-callout tl-callout-ok">
              <strong>{format(result.achievedKg)}kg</strong>을 정확히 맞출 수 있어요.
            </p>
          ) : (
            <p className="tl-callout">
              {format(result.targetKg)}kg은 고른 원판으로 정확히 맞출 수 없어요. 가장 가까운 중량은 <strong>{format(result.achievedKg)}kg</strong>이에요.
              {result.lowerKg !== null && result.higherKg !== null && result.lowerKg !== result.higherKg ? (
                <> (아래 {format(result.lowerKg)}kg · 위 {format(result.higherKg)}kg)</>
              ) : null}
            </p>
          )}

          <div className="tl-bar-wrap">
            <BarDrawing result={result} />
          </div>

          <h4 className="tl-subtitle">
            한쪽에 끼울 원판 <span className="tl-subtle">합계 {format(result.perSideKg)}kg · 양쪽 동일</span>
          </h4>
          {result.perSide.length > 0 ? (
            <ul className="tl-stack">
              {result.perSide.map((stack) => (
                <li key={stack.plateKg}>
                  <span className="tl-stack-kg">{format(stack.plateKg)}kg</span>
                  <span className="tl-stack-count">× {stack.count}장</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="tl-help">원판 없이 바만 들면 돼요.</p>
          )}
        </div>
      ) : null}
    </section>
  );
}

export default PlateCalculator;
