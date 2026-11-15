type Listener = () => void;

export interface PersistentStore<T> {
  get(): T;
  set(next: T): void;
  subscribe(listener: Listener): () => void;
  /** 마지막 저장이 실패했는지(사생활 보호 모드, 용량 초과 등) */
  hasError(): boolean;
}

/**
 * localStorage 한 키를 감싸는 작은 외부 스토어.
 * 같은 탭의 여러 컴포넌트와 다른 탭이 같은 값을 보도록 맞춰 줍니다.
 * decode는 어떤 입력(null, 깨진 값 포함)에도 안전한 값을 돌려줘야 합니다.
 * encode가 undefined를 돌려주면 키를 지웁니다.
 */
export function createPersistentStore<T>(
  key: string,
  decode: (raw: unknown) => T,
  encode: (value: T) => unknown,
): PersistentStore<T> {
  let loaded = false;
  let value = undefined as T;
  let failed = false;
  let bound = false;
  const listeners = new Set<Listener>();

  const read = (): T => {
    try {
      if (typeof localStorage === 'undefined') return decode(null);
      const text = localStorage.getItem(key);
      return decode(text == null ? null : JSON.parse(text));
    } catch {
      return decode(null);
    }
  };

  const emit = () => listeners.forEach((listener) => listener());

  const bind = () => {
    if (bound || typeof window === 'undefined') return;
    bound = true;
    window.addEventListener('storage', (event) => {
      if (event.key !== null && event.key !== key) return;
      value = read();
      loaded = true;
      emit();
    });
  };

  return {
    get() {
      if (!loaded) {
        value = read();
        loaded = true;
      }
      return value;
    },
    set(next) {
      value = next;
      loaded = true;
      try {
        const encoded = encode(next);
        if (encoded === undefined) localStorage.removeItem(key);
        else localStorage.setItem(key, JSON.stringify(encoded));
        failed = false;
      } catch {
        failed = true;
      }
      emit();
    },
    subscribe(listener) {
      bind();
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    hasError: () => failed,
  };
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function createId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  } catch {
    /* 아래 대체 경로 사용 */
  }
  return `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
