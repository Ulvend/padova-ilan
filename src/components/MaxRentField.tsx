import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { MAX_PRICE_UNLIMITED } from '../context/AppContext';

const MIN_RENT = 200;
const STEP = 25;

interface MaxRentFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  labelClassName: string;
}

const formatRent = (value: number): string => `€${value}${value >= MAX_PRICE_UNLIMITED ? '+' : ''}`;

// Masaüstü arama çubuğundaki "Maks. kira" alanı: butona basınca açılan kaydırma çubuğuyla seçilir.
export const MaxRentField: React.FC<MaxRentFieldProps> = ({ label, value, onChange, labelClassName }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Dışarı tıklayınca ya da Escape ile kapanır.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const progress = ((value - MIN_RENT) / (MAX_PRICE_UNLIMITED - MIN_RENT)) * 100;

  return (
    <div ref={rootRef} className="relative w-[150px] shrink-0">
      <button
        type="button"
        id="btn-max-price"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="w-full h-full px-6 flex flex-col justify-center gap-1 text-left cursor-pointer"
      >
        <span className={labelClassName}>{label}</span>
        <span className="relative block w-full text-[15px] font-semibold text-stone-900 truncate pr-5">
          {formatRent(value)}
          <ChevronDown className={`w-4 h-4 text-stone-500 absolute right-0 top-1/2 -translate-y-1/2 transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={label}
          className="absolute z-30 top-full right-0 mt-3 w-[300px] p-5 bg-white border border-stone-200 rounded-2xl shadow-[0_12px_32px_rgba(28,25,23,0.14)]"
        >
          <div className="flex items-baseline justify-between mb-3">
            <span className={labelClassName}>{label}</span>
            <span className="text-2xl font-extrabold tracking-tight text-stone-900">{formatRent(value)}</span>
          </div>
          <input
            id="slider-max-rent"
            type="range"
            min={MIN_RENT}
            max={MAX_PRICE_UNLIMITED}
            step={STEP}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            aria-label={label}
            aria-valuetext={formatRent(value)}
            className="w-full h-2 rounded-lg cursor-pointer appearance-none accent-orange-600"
            style={{
              background: `linear-gradient(to right, #ea580c ${progress}%, #e7e5e4 ${progress}%)`,
            }}
          />
          <div className="flex justify-between mt-2 text-[11px] font-medium text-stone-400">
            <span>€{MIN_RENT}</span>
            <span>{formatRent(MAX_PRICE_UNLIMITED)}</span>
          </div>
        </div>
      )}
    </div>
  );
};
