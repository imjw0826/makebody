import { useId, useState } from 'react';
import { brzycki, epley, percentTable } from './calc';
import './tools.css';

export interface OneRepMaxCalculatorProps {
  defaultWeightKg?: number;
  defaultReps?: number;
  className?: string;
}

const FOCUS_LABEL = { strength: '근력', hypertrophy: '근비대', endurance: '근지구력' } as const;
const MAX_REPS = 30;
const RELIABLE_REPS = 12;

function format(value: number, digits = 1): string {
  return value.toLocaleString('ko-KR', { maximumFractionDigits: digits });
}

export function OneRepMaxCalculator({ defaultWeightKg, defaultReps, className }: OneRepMaxCalculatorProps) {
  const [weight, setWeight] = useState(defaultWeightKg && defaultWeightKg > 0 ? String(defaultWeightKg) : '');
  const [reps, setReps] = useState(defaultReps && defaultReps > 0 ? String(defaultReps) : '');
  const headingId = useId();
  const weightId = useId();
  const repsId = useId();
  const helpId = useId();

  const w = Number(weight);
  const r = Number(reps);
  const filled = weight.trim() !== '' && reps.trim() !== '';
  const valid = filled && Number.isFinite(w) && w > 0 && Number.isInteger(r) && r >= 1 && r <= MAX_REPS;
  const epleyKg = valid ? epley(w, r) : null;
  const brzyckiKg = valid ? brzycki(w, r) : null;
  const average = epleyKg !== null && brzyckiKg !== null ? (epleyKg + brzyckiKg) / 2 : null;
  const rows = average !== null ? percentTable(average) : [];

  let message = '들어 올린 중량과 횟수를 입력하면 추정 1RM을 계산해 드려요.';
  if (filled && !valid) message = `중량은 0보다 크게, 횟수는 1–${MAX_REPS}회 사이 정수로 입력해 주세요.`;
  else if (valid && r > RELIABLE_REPS) message = `${RELIABLE_REPS}회를 넘는 기록은 오차가 커져요. 가능하면 ${RELIABLE_REPS}회 이하 세트로 계산해 보세요.`;
  else if (valid) message = '두 공식의 평균을 기준으로 아래 표를 만들었어요.';

  return (
    <section className={`tl-root tl-orm${className ? ` ${className}` : ''}`} aria-labelledby={headingId}>
      <h3 id={headingId} className="tl-title">1RM 계산기</h3>

      <div className="tl-fields">
        <div className="tl-field">
          <label htmlFor={weightId}>중량 (kg)</label>
          <input
            id={weightId}
            className="tl-input"
            type="number"
            inputMode="decimal"
            min={0}
            step={2.5}
            placeholder="예: 80"
            value={weight}
            aria-describedby={helpId}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>
        <div className="tl-field">
          <label htmlFor={repsId}>횟수</label>
          <input
            id={repsId}
            className="tl-input"
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_REPS}
            step={1}
            placeholder="예: 5"
            value={reps}
            aria-describedby={helpId}
            onChange={(e) => setReps(e.target.value)}
          />
        </div>
      </div>
      <p id={helpId} className={`tl-help${filled && !valid ? ' tl-help-warn' : ''}`} aria-live="polite">{message}</p>

      {average !== null && epleyKg !== null && brzyckiKg !== null ? (
        <>
          <dl className="tl-results" aria-live="polite">
            <div className="tl-result tl-result-main">
              <dt>추정 1RM (평균)</dt>
              <dd>
                {format(average)}
                <span className="tl-unit">kg</span>
              </dd>
            </div>
            <div className="tl-result">
              <dt>Epley</dt>
              <dd>
                {format(epleyKg)}
                <span className="tl-unit">kg</span>
              </dd>
            </div>
            <div className="tl-result">
              <dt>Brzycki</dt>
              <dd>
                {format(brzyckiKg)}
                <span className="tl-unit">kg</span>
              </dd>
            </div>
          </dl>

          <div className="tl-table-wrap" tabIndex={0} role="region" aria-label="1RM 비율별 중량 표">
            <table className="tl-table">
              <caption className="tl-sr">1RM 대비 50–95% 중량과 일반적인 목표 횟수</caption>
              <thead>
                <tr>
                  <th scope="col">강도</th>
                  <th scope="col">중량</th>
                  <th scope="col">2.5kg 단위</th>
                  <th scope="col">목표 횟수</th>
                  <th scope="col">주 목적</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.percent}>
                    <th scope="row">{row.percent}%</th>
                    <td>{format(row.loadKg)}kg</td>
                    <td>{format(row.roundedKg, 2)}kg</td>
                    <td>{row.reps}회</td>
                    <td>{FOCUS_LABEL[row.focus]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="tl-fine">추정치는 사람과 종목에 따라 달라요. 목표 횟수는 흔히 쓰이는 기준이니 컨디션에 맞게 조절하고, 최대 중량은 보조자와 함께 시도하세요.</p>
        </>
      ) : null}
    </section>
  );
}

export default OneRepMaxCalculator;
