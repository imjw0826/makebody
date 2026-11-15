import { useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
export function useStoredState<T>(
  key: string,
  initial: T,
  validate: (value: unknown) => value is T,
): [T, Dispatch<SetStateAction<T>>, string] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(key) ?? "null");
      return validate(stored) ? stored : initial;
    } catch {
      return initial;
    }
  });
  const current = useRef(value);
  const [error, setError] = useState("");
  const update: Dispatch<SetStateAction<T>> = (action) => {
    const next =
      typeof action === "function"
        ? (action as (prev: T) => T)(current.current)
        : action;
    current.current = next;
    try {
      localStorage.setItem(key, JSON.stringify(next));
      setError("");
    } catch {
      setError(
        "브라우저 저장 공간에 접근할 수 없습니다. 현재 기록은 새로고침하면 사라질 수 있어요.",
      );
    }
    setValue(next);
  };
  return [value, update, error];
}
