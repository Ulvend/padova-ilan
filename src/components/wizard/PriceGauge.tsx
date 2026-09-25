import React from 'react';
import { Scale } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { LOW_RATIO, HIGH_RATIO } from '../../utils/districtPricing';
import { Language, RoomType } from '../../types';
import { WIZARD_TEXT } from '../../utils/wizardText';
import { formatPerM2 } from '../../utils/format';

interface PriceGaugeProps {
  price: number;
  district: string;
  roomType: RoomType;
  /** Form alanları olduğu gibi (boş olabilir). Singola/Doppia'da oda, Monolocale/Bilocale'de ev metrekaresi kullanılır. */
  roomM2: string;
  apartmentM2: string;
  lang: Language;
}

// Aralık ortalamanın %75–%125'i; eşikler ilan sayfasındaki karşılaştırmayla aynıdır (%95 / %110).
const MIN = 0.75;
const MAX = 1.25;
const LOW = LOW_RATIO;
const HIGH = HIGH_RATIO;
const pct = (r: number) => ((Math.min(MAX, Math.max(MIN, r)) - MIN) / (MAX - MIN)) * 100;

export const PriceGauge: React.FC<PriceGaugeProps> = ({ price, district, roomType, roomM2, apartmentM2, lang }) => {
  const w = WIZARD_TEXT[lang];
  const { getPriceInsight } = useApp();
  // Düzenlenen ilanın kendi fiyatı ortalamaya girmesin. Fiyat veya metrekare boşken de bölge ortalaması gösterilir.
  const { id: editingId } = useParams<{ id?: string }>();
  const insight = getPriceInsight({
    id: editingId,
    district,
    roomType,
    price,
    roomM2: Number(roomM2) || 0,
    apartmentM2: Number(apartmentM2) || 0,
  });
  // Ortalama €/m²; yeterli ilan yoksa 0.
  const avg = insight.average > 0 ? insight.average : undefined;
  const fmt = (n: number) => `€${formatPerM2(n, lang)}/m²`;

  const shell = 'rounded-xl border border-stone-200 bg-stone-50 px-4 py-3.5';

  if (!avg) {
    return (
      <div className={shell}>
        <p className="flex items-center gap-2 text-sm font-semibold text-stone-700">
          <Scale className="h-4 w-4 text-stone-500" />
          {w.radarTitle}
        </p>
        <p className="mt-1 text-[13px] text-stone-500">{w.radarNoData}</p>
      </div>
    );
  }

  const ratio = insight.pricePerM2 > 0 ? insight.pricePerM2 / avg : null;
  const status = ratio === null ? null : ratio <= LOW ? 'low' : ratio >= HIGH ? 'high' : 'fair';
  const statusText = status === 'low' ? w.radarLow : status === 'high' ? w.radarHigh : w.radarFair;
  const message = status === 'low' ? w.radarLowMsg : status === 'high' ? w.radarHighMsg : status === 'fair' ? w.radarFairMsg : price > 0 ? w.radarNeedArea : w.radarEmpty;
  const badge =
    status === 'low'
      ? 'bg-emerald-100 text-emerald-800'
      : status === 'high'
      ? 'bg-rose-100 text-rose-800'
      : 'bg-amber-100 text-amber-800';

  return (
    <div className={shell} aria-live="polite">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-semibold text-stone-800">
          <Scale className="h-4 w-4 text-emerald-600" />
          {w.radarTitle}
        </p>
        {status && <span className={`rounded-full px-2.5 py-0.5 text-[13px] font-bold ${badge}`}>{statusText}</span>}
      </div>

      <div className="relative mt-5 mb-1 h-2.5 rounded-full">
        <div className="absolute inset-0 flex overflow-hidden rounded-full">
          <span className="bg-emerald-400" style={{ width: `${pct(LOW)}%` }} />
          <span className="bg-amber-300" style={{ width: `${pct(HIGH) - pct(LOW)}%` }} />
          <span className="flex-1 bg-rose-400" />
        </div>
        {/* Bölge ortalaması */}
        <span className="absolute top-1/2 h-4 w-0.5 -translate-y-1/2 bg-stone-900/50" style={{ left: `${pct(1)}%` }} />
        {ratio !== null && (
          <span
            className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-stone-900 shadow-md transition-[left] duration-300"
            style={{ left: `${pct(ratio)}%` }}
          />
        )}
      </div>

      <div className="mt-1 flex justify-between text-[12px] font-medium text-stone-500 tabular-nums">
        <span>{fmt(avg * MIN)}</span>
        <span>
          {w.radarAvg}: {fmt(avg)}
        </span>
        <span>{fmt(avg * MAX)}</span>
      </div>

      {ratio !== null && (
        <p className="mt-2.5 text-[13px] font-semibold text-stone-800 tabular-nums">
          {fmt(insight.pricePerM2)} · {insight.areaM2} m²
        </p>
      )}
      <p className="mt-1 text-[13px] text-stone-600">{message}</p>
    </div>
  );
};
