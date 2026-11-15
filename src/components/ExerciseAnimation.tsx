import { useEffect, useRef, useState } from 'react';
import type { Exercise } from '../data/exercises';
import media from '../data/exercise-media.json';
import './exercise-animation.css';

export interface ExerciseAnimationProps {
  exercise: Exercise;
  playing?: boolean;
  speed?: number;
  className?: string;
  compact?: boolean;
}
export function exerciseMedia(id: string) {
  return media[id as keyof typeof media];
}

export default function ExerciseAnimation({ exercise, playing = false, speed = 1, compact = false, className = '' }: ExerciseAnimationProps) {
  const entry = exerciseMedia(exercise.id);
  const canvas = useRef<HTMLCanvasElement>(null);
  const current = useRef(0);
  const elapsed = useRef(0);
  const [frame, setFrame] = useState(0);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const atlas = useRef<HTMLImageElement | null>(null);
  const base = import.meta.env.BASE_URL;
  const draw = (index: number) => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx || !atlas.current) return;
    const { width, height, columns } = entry;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(atlas.current, (index % columns) * width, Math.floor(index / columns) * height, width, height, 0, 0, width, height);
  };
  useEffect(() => {
    let canceled = false;
    setReady(false); setFailed(false); setFrame(0); current.current = 0; elapsed.current = 0;
    const image = new Image();
    image.onload = () => {
      if (canceled) return;
      atlas.current = image;
      const ctx = canvas.current?.getContext('2d');
      ctx?.drawImage(image, 0, 0, entry.width, entry.height, 0, 0, entry.width, entry.height);
      setReady(true);
    };
    image.onerror = () => { if (!canceled) setFailed(true); };
    image.src = base + entry.atlas;
    return () => { canceled = true; atlas.current = null; };
  }, [entry, base]);
  useEffect(() => {
    if (!ready || !playing || (compact && window.matchMedia("(prefers-reduced-motion: reduce)").matches)) return;
    let request = 0;
    let previous = 0;
    const tick = (now: number) => {
      if (previous) elapsed.current += Math.min(now - previous, 250) * speed;
      previous = now;
      let moved = false;
      while (elapsed.current >= entry.durations[current.current]) {
        elapsed.current -= entry.durations[current.current];
        current.current = (current.current + 1) % entry.frameCount;
        moved = true;
      }
      if (moved) {
        const ctx = canvas.current?.getContext('2d');
        const image = atlas.current;
        if (ctx && image) ctx.drawImage(image, (current.current % entry.columns) * entry.width, Math.floor(current.current / entry.columns) * entry.height, entry.width, entry.height, 0, 0, entry.width, entry.height);
        setFrame(current.current);
      }
      request = requestAnimationFrame(tick);
    };
    request = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(request);
  }, [ready, playing, speed, entry, compact]);
  return <figure className={`exercise-animation anatomy-player${compact ? ' exercise-animation--compact' : ''} ${className}`} data-exercise={exercise.id} data-frame={frame} data-playing={playing}>
    <canvas ref={canvas} width={entry.width} height={entry.height} role="img" aria-label={`${exercise.name} 동작 애니메이션, 붉은색은 사용 근육`} />
    {!ready && <img src={base + entry.poster} alt={`${exercise.name} 시작 자세`} className="anatomy-poster" />}
    {failed && <p role="status">애니메이션을 불러오지 못했습니다. <a href={base + entry.gif}>GIF 열기</a></p>}
    {!compact && <figcaption className="anatomy-timeline">
      <input type="range" aria-label="동작 프레임" min={0} max={entry.frameCount - 1} value={frame} onChange={event => {
        current.current = Number(event.target.value); elapsed.current = 0;
        setFrame(current.current); draw(current.current);
      }} />
      <span>{Math.round((frame + 1) / entry.frameCount * 100)}%</span>
    </figcaption>}
  </figure>;
}
