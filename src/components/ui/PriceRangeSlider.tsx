import React from 'react';
import { MAX_PRICE_UNLIMITED } from '../../utils/listingFilters';

export const MIN_RENT = 200;
export const RENT_STEP = 25;

interface PriceRangeSliderProps {
  /** Taban fiyat; MIN_RENT ise alt sınır yok. */
  low: number;
  /** Tavan fiyat; MAX_PRICE_UNLIMITED ise üst sınır yok. */
  high: number;
  onChange: (low: number, high: number) => void;
  lowLabel: string;
  highLabel: string;
  idPrefix?: string;
}

/** "€300" ya da uçlarda "€200" / "€900+" gibi. */
export const formatRentBound = (value: number): string => `€${value}${value >= MAX_PRICE_UNLIMITED ? '+' : ''}`;

/** Fiyat aralığı özeti: "Fark etmez" yerine çağıran karar verir; burada yalnızca sayısal aralık biçimlenir. */
export const formatRentRange = (low: number, high: number): string => `${formatRentBound(low)} – ${formatRentBound(high)}`;

/** Taban ve tavan fiyat için iki tutamaçlı kaydırıcı. Tutamaçlar birbirini geçemez (en az bir adım fark kalır). */
export const PriceRangeSlider: React.FC<PriceRangeSliderProps> = ({ low, high, onChange, lowLabel, highLabel, idPrefix = 'rent' }) => {
  const span = MAX_PRICE_UNLIMITED - MIN_RENT;
  const lowPct = ((low - MIN_RENT) / span) * 100;
  const highPct = ((high - MIN_RENT) / span) * 100;

  return (
    <div className="relative h-7 w-full">
      <div className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-stone-200" aria-hidden="true" />
      <div className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-orange-600" style={{ left: `${lowPct}%`, right: `${100 - highPct}%` }} aria-hidden="true" />
      <input
        id={`${idPrefix}-low`}
        type="range"
        className="dual-range"
        min={MIN_RENT}
        max={MAX_PRICE_UNLIMITED}
        step={RENT_STEP}
        value={low}
        onChange={(e) => onChange(Math.min(Number(e.target.value), high - RENT_STEP), high)}
        aria-label={lowLabel}
        aria-valuetext={formatRentBound(low)}
        // Tutamaçlar üst üste geldiğinde alttaki de tutulabilsin: yüksek uçta alt tutamaç öne çıkar.
        style={{ zIndex: low > MAX_PRICE_UNLIMITED - 2 * RENT_STEP ? 5 : 3 }}
      />
      <input
        id={`${idPrefix}-high`}
        type="range"
        className="dual-range"
        min={MIN_RENT}
        max={MAX_PRICE_UNLIMITED}
        step={RENT_STEP}
        value={high}
        onChange={(e) => onChange(low, Math.max(Number(e.target.value), low + RENT_STEP))}
        aria-label={highLabel}
        aria-valuetext={formatRentBound(high)}
        style={{ zIndex: 4 }}
      />
    </div>
  );
};
