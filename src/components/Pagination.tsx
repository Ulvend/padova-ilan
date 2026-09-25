import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Language } from '../types';
import { HOME_TEXT, fillText } from '../utils/homeText';

interface PaginationProps {
  currentPage: number;
  pageCount: number;
  onChange: (page: number) => void;
  currentLang?: Language;
}

// 7 sayfaya kadar hepsini, fazlasında ilk/son sayfa ve mevcut sayfanın komşularını gösterir: 1 … 4 5 6 … 12
export const getPageItems = (current: number, count: number): Array<number | 'gap-start' | 'gap-end'> => {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  const items: Array<number | 'gap-start' | 'gap-end'> = [1];
  if (current > 3) items.push('gap-start');
  for (let i = Math.max(2, current - 1); i <= Math.min(count - 1, current + 1); i++) items.push(i);
  if (current < count - 2) items.push('gap-end');
  items.push(count);
  return items;
};

export const Pagination: React.FC<PaginationProps> = ({ currentPage, pageCount, onChange, currentLang = 'it' }) => {
  const h = HOME_TEXT[currentLang] || HOME_TEXT.it;
  if (pageCount <= 1) return null;

  const base = 'min-w-[44px] h-11 px-3.5 rounded-xl border text-[15px] flex items-center justify-center transition';
  const idle = 'bg-white text-stone-900 border-stone-300 hover:border-stone-500 cursor-pointer font-semibold';

  return (
    <nav aria-label={h.pagesLabel} className="pt-6 flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onChange(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label={h.prevPage}
        className={`${base} ${idle} disabled:text-stone-400 disabled:border-stone-200 disabled:cursor-not-allowed disabled:hover:border-stone-200`}
      >
        <ChevronLeft className="w-[18px] h-[18px]" />
      </button>

      {getPageItems(currentPage, pageCount).map((item) =>
        typeof item !== 'number' ? (
          <span key={item} className="min-w-[32px] text-center text-stone-500" aria-hidden="true">
            …
          </span>
        ) : item === currentPage ? (
          <button key={item} type="button" aria-current="page" className={`${base} bg-orange-600 border-orange-600 text-white font-bold`}>
            {item}
          </button>
        ) : (
          <button key={item} type="button" onClick={() => onChange(item)} aria-label={fillText(h.goToPage, { n: item })} className={`${base} ${idle}`}>
            {item}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onChange(currentPage + 1)}
        disabled={currentPage >= pageCount}
        aria-label={h.nextPage}
        className={`${base} ${idle} disabled:text-stone-400 disabled:border-stone-200 disabled:cursor-not-allowed disabled:hover:border-stone-200`}
      >
        <ChevronRight className="w-[18px] h-[18px]" />
      </button>
    </nav>
  );
};
