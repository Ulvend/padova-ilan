import React, { useEffect, useRef, useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { FilterState, Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { LANG_LOCALE } from '../utils/locale';
import { fillText } from '../utils/homeText';
import { DateRangePicker, fromISO, toISO } from './ui/DateRangePicker';

interface StartDateFilterProps {
  filters: FilterState;
  onFilterChange: (updates: Partial<FilterState>) => void;
  currentLang: Language;
}

const CLEARED: Partial<FilterState> = { contractStartFrom: undefined, contractStartTo: undefined };

/** Seçili başlangıç filtresinin kısa metni: "Tüm tarihler", "1 Eki – 15 Eki" ya da "1 Eki ve sonrası". */
const startDateSummary = (filters: FilterState, lang: Language): string => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.it;
  const { contractStartFrom: from, contractStartTo: to } = filters;
  if (!from) return t.allDates;
  const thisYear = new Date().getFullYear();
  const fmt = (iso: string) => {
    const d = fromISO(iso)!;
    return new Intl.DateTimeFormat(LANG_LOCALE[lang], {
      day: 'numeric',
      month: 'short',
      ...(d.getFullYear() !== thisYear ? { year: 'numeric' } : {}),
    }).format(d);
  };
  return to ? `${fmt(from)} – ${fmt(to)}` : fillText(t.startFromOnwards, { date: fmt(from) });
};

export const hasStartDateFilter = (filters: FilterState) => Boolean(filters.contractStartFrom);

/** Takvim: ilk tıklama en erken, ikinci tıklama (isteğe bağlı) en geç başlangıç günü. */
export const StartDatePanel: React.FC<StartDateFilterProps> = ({ filters, onFilterChange, currentLang }) => {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.it;

  return (
    <div>
      <DateRangePicker
        start={filters.contractStartFrom || ''}
        end={filters.contractStartTo || ''}
        min={toISO(new Date())}
        locale={LANG_LOCALE[currentLang]}
        hintStart={t.startPickFirst}
        hintEnd={t.startPickLast}
        prevLabel={t.prevMonth}
        nextLabel={t.nextMonth}
        onChange={(from, to) => onFilterChange({ contractStartFrom: from || undefined, contractStartTo: to || undefined })}
      />
      {hasStartDateFilter(filters) && (
        <button
          type="button"
          onClick={() => onFilterChange(CLEARED)}
          className="mt-1 min-h-[36px] text-sm font-semibold text-stone-600 hover:text-stone-900 hover:underline cursor-pointer"
        >
          {t.clearDates}
        </button>
      )}
    </div>
  );
};

/** Ana sayfa arama çubuğundaki alan: tıklanınca takvim açılır. */
export const StartDateField: React.FC<StartDateFilterProps & { label: string; labelClassName: string }> = ({
  label,
  labelClassName,
  ...props
}) => {
  const t = TRANSLATIONS[props.currentLang] || TRANSLATIONS.it;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative flex-1 px-6 flex flex-col justify-center gap-1 min-w-0">
      <span className={labelClassName}>{label}</span>
      <button
        type="button"
        id="btn-start-date"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="w-full flex items-center gap-2 text-left text-[15px] font-semibold text-stone-900 cursor-pointer outline-none"
      >
        <Calendar className="w-4 h-4 text-orange-600 shrink-0" />
        <span className="truncate flex-1">{startDateSummary(props.filters, props.currentLang)}</span>
        <ChevronDown className={`w-4 h-4 text-stone-500 shrink-0 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div role="dialog" aria-label={label} className="absolute left-2 top-full mt-3 z-40 w-[360px] bg-white border border-stone-200 rounded-2xl shadow-[0_16px_40px_rgba(28,25,23,0.14)] p-4">
          <StartDatePanel {...props} />
          <div className="mt-2 pt-3 border-t border-stone-100 flex justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="min-h-[40px] px-5 bg-stone-900 hover:bg-stone-800 text-white text-sm font-bold rounded-xl cursor-pointer"
            >
              {t.doneBtn}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
