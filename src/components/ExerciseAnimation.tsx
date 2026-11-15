import { useEffect, useState } from 'react';
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
  const [frame, setFrame] = useState(0);
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFrame(0); setFailed(false); }, [exercise.id]);
  useEffect(() => {
    if (!playing || entry.frames.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setFrame(value => (value + 1) % entry.frames.length), 1800 / Math.max(.5, Math.min(2, speed)));
    return () => window.clearInterval(timer);
  }, [playing, speed, entry]);
  const index = frame % entry.frames.length;
  return <figure className={`exercise-animation exercise-photo${compact ? ' exercise-animation--compact' : ''} ${className}`} data-exercise={exercise.id}>
    {failed ? <p role="status">이미지를 불러오지 못했습니다. 아래 운동 방법을 확인해 주세요.</p> : entry.frames.map((src, i) => <img
      key={src}
      src={`${import.meta.env.BASE_URL}${src}`}
      alt={`${exercise.name} ${entry.frames.length > 1 ? i === 0 ? '시작 자세' : '수축 자세' : '자세 참고 이미지'}`}
      className={i === index ? 'exercise-photo-frame is-visible' : 'exercise-photo-frame'}
      aria-hidden={i !== index}
      decoding="async"
      loading={compact ? 'lazy' : 'eager'}
      onError={() => setFailed(true)}
    />)}
    {!compact && entry.frames.length > 1 && <figcaption className="photo-steps">
      {entry.frames.map((_, i) => <button key={i} type="button" aria-pressed={index === i} onClick={() => setFrame(i)}>{i === 0 ? '시작 자세' : '수축 자세'}</button>)}
    </figcaption>}
  </figure>;
}
