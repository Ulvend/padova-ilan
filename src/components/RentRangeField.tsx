import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { MAX_PRICE_UNLIMITED } from '../utils/listingFilters';
import { MIN_RENT, PriceRangeSlider, formatRentBound, formatRentRange } from './ui/PriceRangeSlider';

interface RentRangeFieldProps {
  label: string;
  /** Taban fiyat (MIN_RENT = sınır yok). */
  min: number;
  /** Tavan fiyat (MAX_PRICE_UNLIMITED = sınır yok). */
  max: number;
  onChange: (min: number, max: number) => void;
  labelClassName: string;
  minLabel: string;
  maxLabel: string;
}

// Masaüstü arama çubuğundaki "Kira" alanı: butona basınca açılan çift uçlu kaydırıcıyla taban ve tavan fiyat seçilir.
export const RentRangeField: React.FC<RentRangeFieldProps> = ({ label, min, max, onChange, labelClassName, minLabel, maxLabel }) => {
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

  // Yalnızca tavan seçiliyse eski görünüm ("€450"), taban da varsa aralık ("€300 – €450").
  const summary = min > MIN_RENT ? formatRentRange(min, max) : formatRentBound(max);

  return (
    <div ref={rootRef} className="relative w-[170px] shrink-0">
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
          {summary}
          <ChevronDown className={`w-4 h-4 text-stone-500 absolute right-0 top-1/2 -translate-y-1/2 transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={label}
          className="absolute z-30 top-full right-0 mt-3 w-[320px] p-5 bg-white border border-stone-200 rounded-2xl shadow-[0_12px_32px_rgba(28,25,23,0.14)]"
        >
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <span className={labelClassName}>{minLabel}</span>
              <div className="text-xl font-extrabold tracking-tight text-stone-900">{formatRentBound(min)}</div>
            </div>
            <div className="text-right">
              <span className={labelClassName}>{maxLabel}</span>
              <div className="text-xl font-extrabold tracking-tight text-stone-900">{formatRentBound(max)}</div>
            </div>
          </div>
          <PriceRangeSlider low={min} high={max} onChange={onChange} lowLabel={minLabel} highLabel={maxLabel} idPrefix="slider-rent" />
          <div className="flex justify-between mt-2 text-[11px] font-medium text-stone-400">
            <span>€{MIN_RENT}</span>
            <span>{formatRentBound(MAX_PRICE_UNLIMITED)}</span>
          </div>
        </div>
      )}
    </div>
  );
};
