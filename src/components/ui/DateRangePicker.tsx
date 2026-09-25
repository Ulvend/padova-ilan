import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const pad = (n: number) => String(n).padStart(2, '0');
export const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fromISO = (s: string): Date | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
};

/** İki ISO tarih arasındaki süre, en yakın aya yuvarlanmış. */
export const monthsBetween = (startISO: string, endISO: string): number | null => {
  const a = fromISO(startISO);
  const b = fromISO(endISO);
  if (!a || !b || b <= a) return null;
  const days = (b.getTime() - a.getTime()) / 86_400_000;
  return Math.max(1, Math.round(days / 30.4375));
};

interface DateRangePickerProps {
  start: string;
  end: string;
  onChange: (start: string, end: string) => void;
  locale: string;
  min?: string;
  hintStart: string;
  hintEnd: string;
  prevLabel: string;
  nextLabel: string;
  // Bitiş, başlangıçtan en az bu kadar gün sonra olmalı; aradaki günler seçilemez (ör. 30 gün ve altı kalışlar).
  minSpanDays?: number;
  // Başlangıç seçildikten sonra gösterilen ipucu; {date} en erken bitiş günüyle değişir.
  minSpanHint?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({ start, end, onChange, locale, min, hintStart, hintEnd, prevLabel, nextLabel, minSpanDays, minSpanHint }) => {
  const initial = fromISO(start) || new Date();
  const [cursor, setCursor] = useState(() => new Date(initial.getFullYear(), initial.getMonth(), 1));
  const [hover, setHover] = useState<string | null>(null);

  const monthLabel = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(cursor),
    [locale, cursor]
  );

  // Pazartesi başlangıçlı hafta günü etiketleri
  const weekdays = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short' });
    const monday = new Date(2024, 0, 1); // 1 Ocak 2024 Pazartesi
    return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(monday.getFullYear(), 0, 1 + i)));
  }, [locale]);

  const cells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const out: (Date | null)[] = Array(offset).fill(null);
    for (let d = 1; d <= daysInMonth; d++) out.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
    while (out.length % 7 !== 0) out.push(null);
    return out;
  }, [cursor]);

  const pickDay = (iso: string) => {
    if (!start || (start && end)) onChange(iso, '');
    else if (iso <= start) onChange(iso, '');
    else onChange(start, iso);
  };

  // Bitiş seçilirken (başlangıç var, bitiş yok) en erken bitiş günü; ondan önceki günler seçilemez.
  const earliestEnd = (() => {
    if (!minSpanDays || !start || end) return '';
    const s = fromISO(start);
    return s ? toISO(new Date(s.getFullYear(), s.getMonth(), s.getDate() + minSpanDays)) : '';
  })();
  const rangeEnd = end || (start && hover && hover > start && (!earliestEnd || hover >= earliestEnd) ? hover : '');
  const todayISO = toISO(new Date());

  return (
    <div className="w-full max-w-[16rem] select-none">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          aria-label={prevLabel}
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-600 hover:bg-stone-100 cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-bold capitalize text-stone-900">{monthLabel}</span>
        <button
          type="button"
          aria-label={nextLabel}
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-600 hover:bg-stone-100 cursor-pointer"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 text-center text-[11px] font-semibold uppercase tracking-tight text-stone-400">
        {weekdays.map((w, i) => (
          <span key={i} className="py-1">{w}</span>
        ))}
      </div>

      <div className="grid grid-cols-7" onMouseLeave={() => setHover(null)}>
        {cells.map((d, i) => {
          if (!d) return <span key={i} className="h-9" />;
          const iso = toISO(d);
          const tooShort = Boolean(earliestEnd && iso > start && iso < earliestEnd);
          const disabled = Boolean((min && iso < min) || tooShort);
          const isStart = iso === start;
          const isEnd = iso === end;
          const inRange = Boolean(start && rangeEnd && iso > start && iso < rangeEnd);
          const edge = isStart || isEnd;
          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => pickDay(iso)}
              onMouseEnter={() => setHover(iso)}
              aria-pressed={edge}
              aria-label={iso}
              className={`relative h-9 text-sm font-medium tabular-nums transition ${
                edge
                  ? 'z-10 rounded-lg bg-orange-600 font-bold text-white'
                  : inRange
                  ? 'bg-orange-100 text-orange-900'
                  : disabled
                  ? 'text-stone-300 cursor-not-allowed'
                  : 'rounded-lg text-stone-800 hover:bg-stone-100 cursor-pointer'
              } ${!edge && iso === todayISO ? 'ring-1 ring-inset ring-stone-300 rounded-lg' : ''}`}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>

      <p className="mt-2 text-[13px] text-stone-500">{!start ? hintStart : !end ? hintEnd : ' '}</p>
      {earliestEnd && minSpanHint && (
        <p className="text-[13px] font-medium text-stone-700">
          {minSpanHint.replace('{date}', new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(fromISO(earliestEnd)!))}
        </p>
      )}
    </div>
  );
};
