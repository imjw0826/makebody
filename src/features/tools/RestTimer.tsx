import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import './tools.css';

export interface RestTimerProps {
  /** Initial duration in seconds (default 90). */
  defaultSeconds?: number;
  /** Initial state of the sound switch (default on). */
  defaultSound?: boolean;
  /** Called once each time the countdown reaches zero. */
  onComplete?: () => void;
  className?: string;
}

type Status = 'idle' | 'running' | 'paused' | 'done';

const PRESETS = [30, 60, 90, 120, 180];
const MIN_SECONDS = 5;
const MAX_SECONDS = 3600;
const ANNOUNCE_AT = [30, 10];

function clampSeconds(value: number): number {
  return Math.min(MAX_SECONDS, Math.max(MIN_SECONDS, Math.round(value)));
}

function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function spokenDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}초`;
  return seconds === 0 ? `${minutes}분` : `${minutes}분 ${seconds}초`;
}

function createAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    return new Ctor();
  } catch {
    return null;
  }
}

function playBeep(ctx: AudioContext): void {
  const start = ctx.currentTime + 0.02;
  [0, 0.28, 0.56].forEach((offset, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = i === 2 ? 1175 : 880;
    const t = start + offset;
    const length = i === 2 ? 0.34 : 0.16;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.28, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + length + 0.02);
  });
}

const canVibrate = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

export function RestTimer({ defaultSeconds = 90, defaultSound = true, onComplete, className }: RestTimerProps) {
  const initialMs = clampSeconds(Number.isFinite(defaultSeconds) ? defaultSeconds : 90) * 1000;
  const [totalMs, setTotalMs] = useState(initialMs);
  const [remainingMs, setRemainingMs] = useState(initialMs);
  const [status, setStatus] = useState<Status>('idle');
  const [sound, setSound] = useState(defaultSound);
  const [vibration, setVibration] = useState(canVibrate);
  const [custom, setCustom] = useState('');
  const [customError, setCustomError] = useState('');
  const [announcement, setAnnouncement] = useState('');

  // The end time is the single source of truth while running, so a throttled
  // or suspended background tab still shows the right time when it wakes up.
  const endAtRef = useRef(0);
  const firedRef = useRef(false);
  const announcedRef = useRef(new Set<number>());
  const audioRef = useRef<AudioContext | null>(null);
  const settingsRef = useRef({ sound, vibration, onComplete });
  settingsRef.current = { sound, vibration, onComplete };

  const headingId = useId();
  const customId = useId();
  const customErrorId = useId();

  const finish = useCallback(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    setRemainingMs(0);
    setStatus('done');
    setAnnouncement('휴식이 끝났어요. 다음 세트를 시작하세요.');
    const settings = settingsRef.current;
    if (settings.sound && audioRef.current) {
      try {
        playBeep(audioRef.current);
      } catch {
        /* sound is optional */
      }
    }
    if (settings.vibration && canVibrate) {
      try {
        navigator.vibrate([220, 110, 220, 110, 380]);
      } catch {
        /* vibration is optional */
      }
    }
    settings.onComplete?.();
  }, []);

  useEffect(() => {
    if (status !== 'running') return undefined;
    const tick = () => {
      const left = endAtRef.current - Date.now();
      if (left <= 0) {
        finish();
        return;
      }
      setRemainingMs(left);
      const seconds = Math.ceil(left / 1000);
      for (const mark of ANNOUNCE_AT) {
        if (seconds <= mark && seconds > mark - 2 && !announcedRef.current.has(mark)) {
          announcedRef.current.add(mark);
          setAnnouncement(`${mark}초 남았어요.`);
        }
      }
    };
    tick();
    const interval = window.setInterval(tick, 200);
    document.addEventListener('visibilitychange', tick);
    window.addEventListener('focus', tick);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', tick);
      window.removeEventListener('focus', tick);
    };
  }, [status, finish]);

  useEffect(
    () => () => {
      void audioRef.current?.close().catch(() => undefined);
      audioRef.current = null;
    },
    [],
  );

  // Browsers only allow audio after a user gesture, so the context is prepared on a button press.
  const primeAudio = (enabled: boolean) => {
    if (!enabled) return;
    if (!audioRef.current) audioRef.current = createAudioContext();
    void audioRef.current?.resume().catch(() => undefined);
  };

  const begin = (fromMs: number) => {
    firedRef.current = false;
    announcedRef.current = new Set(ANNOUNCE_AT.filter((mark) => fromMs <= mark * 1000));
    endAtRef.current = Date.now() + fromMs;
    setRemainingMs(fromMs);
    setStatus('running');
    primeAudio(sound);
  };

  const handleStart = () => {
    if (status === 'paused') {
      begin(remainingMs);
      setAnnouncement(`다시 시작했어요. ${spokenDuration(Math.ceil(remainingMs / 1000))} 남았어요.`);
    } else {
      begin(totalMs);
      setAnnouncement(`${spokenDuration(Math.round(totalMs / 1000))} 휴식을 시작했어요.`);
    }
  };

  const handlePause = () => {
    const left = Math.max(0, endAtRef.current - Date.now());
    if (left === 0) {
      finish();
      return;
    }
    setRemainingMs(left);
    setStatus('paused');
    setAnnouncement(`일시정지했어요. ${spokenDuration(Math.ceil(left / 1000))} 남았어요.`);
  };

  const setDuration = (seconds: number, message?: string) => {
    const ms = clampSeconds(seconds) * 1000;
    firedRef.current = false;
    setTotalMs(ms);
    setRemainingMs(ms);
    setStatus('idle');
    setAnnouncement(message ?? `휴식 시간을 ${spokenDuration(ms / 1000)}로 맞췄어요.`);
  };

  const handleReset = () => setDuration(totalMs / 1000, '타이머를 초기화했어요.');

  const handleAdd = () => {
    const add = 15_000;
    const maxMs = MAX_SECONDS * 1000;
    if (status === 'running') {
      const left = Math.min(maxMs, Math.max(0, endAtRef.current - Date.now()) + add);
      endAtRef.current = Date.now() + left;
      setRemainingMs(left);
      setTotalMs((t) => Math.min(maxMs, Math.max(t + add, left)));
      announcedRef.current = new Set(ANNOUNCE_AT.filter((mark) => left <= mark * 1000));
    } else if (status === 'paused') {
      const left = Math.min(maxMs, remainingMs + add);
      setRemainingMs(left);
      setTotalMs((t) => Math.min(maxMs, Math.max(t + add, left)));
    } else {
      const next = Math.min(maxMs, totalMs + add);
      firedRef.current = false;
      setTotalMs(next);
      setRemainingMs(next);
      setStatus('idle');
    }
    setAnnouncement('15초를 더했어요.');
  };

  const handleCustom = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const seconds = Number(custom);
    if (custom.trim() === '' || !Number.isFinite(seconds) || seconds < MIN_SECONDS || seconds > MAX_SECONDS) {
      setCustomError(`${MIN_SECONDS}초에서 ${MAX_SECONDS}초 사이로 입력해 주세요.`);
      return;
    }
    setCustomError('');
    setDuration(seconds);
  };

  const handleSound = (checked: boolean) => {
    setSound(checked);
    primeAudio(checked);
  };

  const displaySeconds = status === 'done' ? 0 : Math.ceil(remainingMs / 1000);
  const totalSeconds = Math.round(totalMs / 1000);
  const ratio = status === 'done' ? 0 : Math.min(1, Math.max(0, remainingMs / totalMs));
  const radius = 84;
  const circumference = 2 * Math.PI * radius;
  const statusText = status === 'running' ? '휴식 중' : status === 'paused' ? '일시정지' : status === 'done' ? '휴식 끝!' : '준비';
  const isActive = status === 'running' || status === 'paused';

  return (
    <section className={`tl-root tl-timer${className ? ` ${className}` : ''}`} aria-labelledby={headingId}>
      <h3 id={headingId} className="tl-title">휴식 타이머</h3>

      <div className={`tl-ring tl-ring-${status}`}>
        <svg className="tl-ring-svg" viewBox="0 0 200 200" aria-hidden="true" focusable="false">
          <circle cx={100} cy={100} r={radius} className="tl-ring-track" />
          <g transform="rotate(-90 100 100)">
            <circle cx={100} cy={100} r={radius} className="tl-ring-edge" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - ratio)} />
            <circle cx={100} cy={100} r={radius} className="tl-ring-fill" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - ratio)} />
          </g>
        </svg>
        <div className="tl-ring-center">
          <span className="tl-clock" role="timer" aria-live="off" aria-label={`남은 시간 ${spokenDuration(displaySeconds)}`}>
            {formatClock(displaySeconds)}
          </span>
          <span className="tl-ring-status">
            {statusText}
            {isActive ? ` · 전체 ${formatClock(totalSeconds)}` : ''}
          </span>
        </div>
      </div>

      <p className="tl-sr" role="status" aria-live="polite">{announcement}</p>

      <div className="tl-actions">
        {status === 'running' ? (
          <button type="button" className="tl-btn tl-btn-primary" onClick={handlePause}>일시정지</button>
        ) : (
          <button type="button" className="tl-btn tl-btn-primary" onClick={handleStart}>
            {status === 'paused' ? '계속' : status === 'done' ? '다시 시작' : '시작'}
          </button>
        )}
        <button type="button" className="tl-btn" onClick={handleAdd} aria-label="15초 추가">+15초</button>
        <button type="button" className="tl-btn" onClick={handleReset} disabled={status === 'idle' && remainingMs === totalMs}>초기화</button>
      </div>

      <div className="tl-group" role="group" aria-label="휴식 시간 빠른 선택">
        {PRESETS.map((seconds) => (
          <button
            key={seconds}
            type="button"
            className="tl-chip"
            aria-pressed={!isActive && totalSeconds === seconds}
            onClick={() => setDuration(seconds)}
          >
            {seconds}초
          </button>
        ))}
      </div>

      <form className="tl-inline-form" onSubmit={handleCustom} noValidate>
        <div className="tl-field">
          <label htmlFor={customId}>직접 입력 (초)</label>
          <input
            id={customId}
            className="tl-input"
            type="number"
            inputMode="numeric"
            min={MIN_SECONDS}
            max={MAX_SECONDS}
            step={5}
            placeholder="예: 75"
            value={custom}
            aria-invalid={customError !== ''}
            aria-describedby={customError ? customErrorId : undefined}
            onChange={(e) => {
              setCustom(e.target.value);
              setCustomError('');
            }}
          />
        </div>
        <button type="submit" className="tl-btn">적용</button>
        {customError ? <p id={customErrorId} className="tl-error" role="alert">{customError}</p> : null}
      </form>

      <div className="tl-switches">
        <label className="tl-check">
          <input type="checkbox" checked={sound} onChange={(e) => handleSound(e.target.checked)} />
          끝나면 소리로 알림
        </label>
        {canVibrate ? (
          <label className="tl-check">
            <input type="checkbox" checked={vibration} onChange={(e) => setVibration(e.target.checked)} />
            끝나면 진동
          </label>
        ) : null}
      </div>
    </section>
  );
}

export default RestTimer;
