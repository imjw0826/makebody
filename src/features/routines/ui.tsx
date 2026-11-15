import { useState } from 'react';
import type { ReactNode } from 'react';

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      className="rt-icon"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export const PlusIcon = () => <Icon><path d="M12 5v14M5 12h14" /></Icon>;
export const ArrowUpIcon = () => <Icon><path d="M12 19V5M6 11l6-6 6 6" /></Icon>;
export const ArrowDownIcon = () => <Icon><path d="M12 5v14M6 13l6 6 6-6" /></Icon>;
export const TrashIcon = () => <Icon><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12M9 7V4h6v3" /></Icon>;
export const CopyIcon = () => <Icon><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h9" /></Icon>;
export const PlayIcon = () => <Icon><path d="M7 5l12 7-12 7z" /></Icon>;
export const PauseIcon = () => <Icon><path d="M8 5v14M16 5v14" /></Icon>;
export const SkipIcon = () => <Icon><path d="M5 5l10 7-10 7zM19 5v14" /></Icon>;
export const CheckIcon = () => <Icon><path d="M5 12.5l4.5 4.5L19 7.5" /></Icon>;
export const CloseIcon = () => <Icon><path d="M6 6l12 12M18 6L6 18" /></Icon>;
export const SearchIcon = () => <Icon><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4 4" /></Icon>;
export const ChevronLeftIcon = () => <Icon><path d="M15 5l-7 7 7 7" /></Icon>;
export const ChevronRightIcon = () => <Icon><path d="M9 5l7 7-7 7" /></Icon>;

interface NumberFieldProps {
  label: string;
  /** true면 라벨을 화면에 그리지 않고 aria-label로만 붙입니다. */
  hideLabel?: boolean;
  value: number | undefined;
  onCommit: (value: number | undefined) => void;
  min: number;
  max: number;
  /** 소수 입력 허용(무게) */
  decimal?: boolean;
  /** 비워 둘 수 있는 값(무게) */
  optional?: boolean;
  unit?: string;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * 숫자 입력칸. 입력 중인 글자는 그대로 두고, 올바른 숫자일 때만 범위 안으로 맞춰 반영합니다.
 * 포커스를 잃으면 저장된 값으로 표시를 되돌립니다.
 */
export function NumberField({
  label,
  hideLabel,
  value,
  onCommit,
  min,
  max,
  decimal,
  optional,
  unit,
  placeholder,
  disabled,
}: NumberFieldProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? (value === undefined ? '' : String(value));

  const handleChange = (text: string) => {
    const cleaned = text.replace(',', '.').replace(decimal ? /[^\d.]/g : /\D/g, '');
    setDraft(cleaned);
    if (cleaned === '') {
      if (optional) onCommit(undefined);
      return;
    }
    const parsed = Number(cleaned);
    if (!Number.isFinite(parsed)) return;
    const clamped = Math.min(max, Math.max(min, parsed));
    onCommit(decimal ? Math.round(clamped * 100) / 100 : Math.round(clamped));
  };

  const input = (
    <span className="rt-field__box">
      <input
        className="rt-field__input"
        type="text"
        inputMode={decimal ? 'decimal' : 'numeric'}
        autoComplete="off"
        value={shown}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={hideLabel ? label : undefined}
        onChange={(event) => handleChange(event.target.value)}
        onFocus={(event) => event.target.select()}
        onBlur={() => setDraft(null)}
      />
      {unit && (
        <span className="rt-field__unit" aria-hidden="true">
          {unit}
        </span>
      )}
    </span>
  );

  if (hideLabel) return <span className="rt-field">{input}</span>;
  return (
    <label className="rt-field">
      <span className="rt-field__label">{label}</span>
      {input}
    </label>
  );
}
