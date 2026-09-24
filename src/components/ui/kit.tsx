import React, { useEffect, useId, useRef, useState } from 'react';
import { HelpCircle, Minus, Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';

// İlan sihirbazının ortak form bileşenleri. Renk: yalnızca orange / stone (+ durum için emerald, rose).
// Tipografi: etiket 14px semibold, yardımcı metin 13px, gövde 16px (mobilde zoom olmasın diye).

export const inputClass = (invalid = false) =>
  `w-full min-h-[44px] rounded-xl border bg-white px-3.5 py-2.5 text-base sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none transition focus:ring-2 ${
    invalid
      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
      : 'border-stone-300 hover:border-stone-400 focus:border-orange-500 focus:ring-orange-500/20'
  }`;

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <section className={`rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 shadow-xs ${className}`}>{children}</section>
);

export const SectionTitle: React.FC<{ children: React.ReactNode; hint?: string; action?: React.ReactNode }> = ({
  children,
  hint,
  action,
}) => (
  <div className="mb-4 flex items-start justify-between gap-3">
    <div>
      <h3 className="text-base font-bold text-stone-900">{children}</h3>
      {hint && <p className="mt-0.5 text-[13px] text-stone-500">{hint}</p>}
    </div>
    {action}
  </div>
);

export const HelpTip: React.FC<{ children: React.ReactNode; label?: string }> = ({ children, label }) => {
  const { t } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <span ref={ref} className="relative inline-flex">
      <button
        type="button"
        aria-label={label ?? t.helpLabel}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-6 w-6 items-center justify-center rounded-full text-stone-400 transition hover:bg-stone-100 hover:text-orange-600 focus-visible:outline-2 focus-visible:outline-orange-500 cursor-pointer"
      >
        <HelpCircle className="h-4 w-4" />
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className="absolute left-1/2 top-full z-30 mt-1.5 w-64 max-w-[80vw] -translate-x-1/2 rounded-xl bg-stone-900 px-3.5 py-2.5 text-[13px] font-normal leading-snug text-white shadow-lg"
        >
          {children}
        </span>
      )}
    </span>
  );
};

interface FieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  optionalText?: string;
  help?: React.ReactNode;
  hint?: string;
  error?: string | null;
  children: React.ReactNode;
  className?: string;
}

export const Field: React.FC<FieldProps> = ({ label, htmlFor, required, optionalText, help, hint, error, children, className = '' }) => (
  <div className={className}>
    <div className="mb-1.5 flex items-center gap-1">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-stone-800">
        {label}
        {required && <span className="ml-0.5 text-orange-600" aria-hidden="true">*</span>}
      </label>
      {!required && optionalText && <span className="text-[13px] font-normal text-stone-400">· {optionalText}</span>}
      {help && <HelpTip>{help}</HelpTip>}
    </div>
    {children}
    {error ? (
      <p role="alert" className="mt-1.5 text-[13px] font-medium text-rose-600">{error}</p>
    ) : (
      hint && <p className="mt-1.5 text-[13px] text-stone-500">{hint}</p>
    )}
  </div>
);

interface SegmentedProps<T extends string> {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon?: React.ReactNode }[];
  ariaLabel?: string;
  className?: string;
}

export function Segmented<T extends string>({ value, onChange, options, ariaLabel, className = '' }: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`grid gap-1 rounded-xl bg-stone-100 p-1 ${className}`}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-sm font-semibold transition cursor-pointer ${
              active ? 'bg-white text-stone-900 shadow-sm ring-1 ring-stone-200' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            {o.icon}
            <span className="truncate">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

interface ChipProps {
  selected: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

// Seçilebilir çip/kart: toggle listesi yerine ikonlu, erişilebilir (aria-pressed).
export const Chip: React.FC<ChipProps> = ({ selected, onClick, icon, children, className = '' }) => (
  <button
    type="button"
    aria-pressed={selected}
    onClick={onClick}
    className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition active:scale-[0.98] cursor-pointer ${
      selected
        ? 'border-orange-500 bg-orange-50 text-orange-900 ring-1 ring-orange-500/30'
        : 'border-stone-300 bg-white text-stone-700 hover:border-stone-400 hover:bg-stone-50'
    } ${className}`}
  >
    {icon && <span className={selected ? 'text-orange-600' : 'text-stone-500'}>{icon}</span>}
    <span>{children}</span>
  </button>
);

interface StepperProps {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  label: string;
  suffix?: string;
}

export const Stepper: React.FC<StepperProps> = ({ value, onChange, min = 0, max = 20, label, suffix }) => (
  <div className="inline-flex items-center gap-1 rounded-xl border border-stone-300 bg-white p-1">
    <button
      type="button"
      aria-label={`${label} −`}
      disabled={value <= min}
      onClick={() => onChange(Math.max(min, value - 1))}
      className="flex h-10 w-10 items-center justify-center rounded-lg text-stone-700 transition hover:bg-stone-100 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
    >
      <Minus className="h-4 w-4" />
    </button>
    <span aria-live="polite" className="min-w-[2.5rem] text-center text-base font-bold tabular-nums text-stone-900">
      {value}
      {suffix && <span className="ml-0.5 text-[13px] font-medium text-stone-500">{suffix}</span>}
    </span>
    <button
      type="button"
      aria-label={`${label} +`}
      disabled={value >= max}
      onClick={() => onChange(Math.min(max, value + 1))}
      className="flex h-10 w-10 items-center justify-center rounded-lg text-stone-700 transition hover:bg-stone-100 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
    >
      <Plus className="h-4 w-4" />
    </button>
  </div>
);

export const InfoBox: React.FC<{ icon?: React.ReactNode; children: React.ReactNode; tone?: 'neutral' | 'accent' | 'good' }> = ({
  icon,
  children,
  tone = 'neutral',
}) => {
  const tones = {
    neutral: 'border-stone-200 bg-stone-50 text-stone-700',
    accent: 'border-orange-200 bg-orange-50 text-orange-900',
    good: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  } as const;
  return (
    <div className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-[13px] leading-snug ${tones[tone]}`}>
      {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
};
