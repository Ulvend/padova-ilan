import React from 'react';
import { MAX_PRICE_UNLIMITED } from '../context/AppContext';
import { RotateCcw, ShieldCheck, Video, Zap, Search, ArrowUpDown, Filter, X, Calendar } from 'lucide-react';
import { FilterState, Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';

interface CategorySidebarProps {
  filters: FilterState;
  onFilterChange: (updates: Partial<FilterState>) => void;
  onResetFilters: () => void;
  currentLang: Language;
}

export const CategorySidebar: React.FC<CategorySidebarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  currentLang,
}) => {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.tr;

  return (
    <aside className="w-full space-y-4">
      <div className="bg-white p-5 space-y-5 text-xs rounded-2xl border border-stone-200 shadow-sm">
        
        {/* Header */}
        <div className="border-b border-stone-100 pb-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-orange-600" />
            <h2 className="font-bold text-sm uppercase tracking-wider text-stone-900">
              {t.filterDeskTitle}
            </h2>
          </div>
          <button 
            id="btn-reset-sidebar-filters"
            onClick={onResetFilters}
            className="text-stone-500 hover:text-stone-900 hover:underline flex items-center gap-1 font-semibold cursor-pointer py-1 px-2 rounded-lg active:bg-stone-100 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.resetFilters}</span>
          </button>
        </div>

        {/* Search by Faculty / Street / Hospital */}
        <div>
          <label className="font-semibold block mb-1.5 uppercase tracking-wide text-stone-600 text-[11px]">
            {t.searchLabel}
          </label>
          <div className="relative">
            <input 
              id="input-filter-search"
              type="text" 
              value={filters.searchQuery}
              onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
              placeholder={t.searchPlaceholder} 
              className="w-full min-h-[42px] border border-stone-200 px-3.5 bg-stone-50/60 rounded-xl outline-none focus:bg-white focus:border-stone-400 text-xs text-stone-900 transition-colors"
            />
            {filters.searchQuery && (
              <button
                onClick={() => onFilterChange({ searchQuery: '' })}
                className="w-7 h-7 rounded-full flex items-center justify-center absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 font-bold text-xs"
                aria-label={t.clearSearch}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Contract Type (Legal Status) */}
        <div className="border-t border-stone-100 pt-4">
          <label className="font-semibold block mb-1.5 uppercase tracking-wide text-stone-600 text-[11px]">
            {t.contractTypeLabel}
          </label>
          <select 
            id="select-contract-type"
            value={filters.contractType}
            onChange={(e) => onFilterChange({ contractType: e.target.value })}
            className="w-full min-h-[42px] border border-stone-200 px-3 bg-stone-50/60 rounded-xl outline-none text-xs text-stone-900 cursor-pointer focus:bg-white focus:border-stone-400 transition-colors"
          >
            <option value="all">{t.filterAny}</option>
            <option value="Contratto per Studenti (Canone Concordato)">
              {t.contractOptionStudent}
            </option>
            <option value="Subentro (Resmi Sözleşme Devri)">
              {t.contractOptionSubentro}
            </option>
            <option value="Contratto Transitorio (1-18 Ay)">
              {t.contractOptionTransitorio}
            </option>
            <option value="Standart 4+4 / 3+2 Yıllık">
              {t.contractOptionStandard}
            </option>
          </select>
          <p className="text-[11px] text-stone-500 mt-1.5 leading-relaxed">
            {t.contractDisclaimer}
          </p>
        </div>

        {/* Security & Verification Shield */}
        <div className="border-t border-stone-100 pt-4 space-y-2.5">
          <label className="font-semibold block uppercase tracking-wide text-stone-600 text-[11px]">
            {t.shieldLabel}
          </label>
          <div className="space-y-1.5">
            <label className="flex items-center gap-2.5 cursor-pointer select-none p-2 rounded-xl hover:bg-stone-50 transition">
              <input 
                id="check-only-video"
                type="checkbox" 
                checked={filters.onlyVideoTour}
                onChange={(e) => onFilterChange({ onlyVideoTour: e.target.checked })}
                className="accent-stone-900 w-4 h-4 rounded cursor-pointer" 
              />
              <span className="font-medium text-stone-800">
                {t.videoShieldOption}
              </span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer select-none p-2 rounded-xl hover:bg-stone-50 transition">
              <input 
                id="check-only-student-verified"
                type="checkbox" 
                checked={filters.onlyStudentVerified}
                onChange={(e) => onFilterChange({ onlyStudentVerified: e.target.checked })}
                className="accent-stone-900 w-4 h-4 rounded cursor-pointer" 
              />
              <span className="font-medium text-stone-800">
                {t.studentIdShieldOption}
              </span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer select-none p-2 rounded-xl hover:bg-stone-50 transition">
              <input 
                id="check-only-high-compatibility"
                type="checkbox" 
                checked={filters.onlyHighCompatibility}
                onChange={(e) => onFilterChange({ onlyHighCompatibility: e.target.checked })}
                className="accent-stone-900 w-4 h-4 rounded cursor-pointer" 
              />
              <span className="font-medium text-stone-800">
                {t.compatibilityShieldOption}
              </span>
            </label>
          </div>
        </div>

        {/* Area & Faculty Proximity */}
        <div className="border-t border-stone-100 pt-4">
          <label className="font-semibold block mb-1.5 uppercase tracking-wide text-stone-600 text-[11px]">
            {t.areaProximityLabel}
          </label>
          <select 
            id="select-district-filter"
            value={filters.district}
            onChange={(e) => onFilterChange({ district: e.target.value })}
            className="w-full min-h-[42px] border border-stone-200 px-3 bg-stone-50/60 rounded-xl outline-none text-xs text-stone-900 cursor-pointer focus:bg-white focus:border-stone-400 transition-colors"
          >
            <option value="all">{t.allAreas}</option>
            <option value="Policlinico / Tıp Fakültesi (< 500m)">{t.districtPoliclinico}</option>
            <option value="Portello / Mühendislik & Fen (< 500m)">{t.districtPortello}</option>
            <option value="Beato Pellegrino / Beşeri Bilimler">{t.districtBeato}</option>
            <option value="Centro Storico / Prato della Valle">{t.districtCentro}</option>
          </select>
        </div>

        {/* Room Type Selector */}
        <div className="border-t border-stone-100 pt-4">
          <label className="font-semibold block mb-1.5 uppercase tracking-wide text-stone-600 text-[11px]">
            {t.roomTypeLabel}
          </label>
          <select 
            id="select-room-type"
            value={filters.roomType}
            onChange={(e) => onFilterChange({ roomType: e.target.value })}
            className="w-full min-h-[42px] border border-stone-200 px-3 bg-stone-50/60 rounded-xl outline-none text-xs text-stone-900 cursor-pointer focus:bg-white focus:border-stone-400 transition-colors"
          >
            <option value="all">{t.allRoomTypes}</option>
            <option value="Singola">{t.singleRoomOption}</option>
            <option value="Doppia">{t.doubleRoomOption}</option>
            <option value="Posto Letto">{t.sharedBedOption}</option>
            <option value="Monolocale">{t.studioOption}</option>
          </select>
        </div>

        {/* Contract Start Date Filter */}
        <div className="border-t border-stone-100 pt-4">
          <label className="font-semibold block mb-1.5 uppercase tracking-wide text-stone-600 text-[11px] flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-orange-600" />
            <span>{t.contractStartDateLabel}</span>
          </label>
          <select 
            id="select-contract-start-date"
            value={filters.contractStartDateFilter || 'all'}
            onChange={(e) => onFilterChange({ contractStartDateFilter: e.target.value })}
            className="w-full min-h-[42px] border border-stone-200 px-3 bg-stone-50/60 rounded-xl outline-none text-xs text-stone-900 cursor-pointer focus:bg-white focus:border-stone-400 transition-colors"
          >
            <option value="all">{t.allDates}</option>
            <option value="immediate">{t.contractStartImmediate}</option>
            <option value="october">{t.dateOctober}</option>
            <option value="november">{t.dateNovember}</option>
            <option value="spring">{t.dateSpring}</option>
          </select>
        </div>

        {/* Budget Slider */}
        <div className="border-t border-stone-100 pt-4">
          <div className="flex justify-between items-center mb-1.5">
            <label className="font-semibold uppercase tracking-wide text-stone-600 text-[11px]">{t.budgetLabel}</label>
            <span className="font-bold text-orange-700 bg-orange-50 px-2.5 py-0.5 rounded-md text-xs border border-orange-200">
              {t.maxBudgetPrefix} €{filters.maxPrice}{filters.maxPrice >= MAX_PRICE_UNLIMITED ? '+' : ''}
            </span>
          </div>
          <input 
            id="slider-max-price"
            type="range" 
            min="200" 
            max={MAX_PRICE_UNLIMITED} 
            step="25" 
            value={filters.maxPrice}
            onChange={(e) => onFilterChange({ maxPrice: Number(e.target.value) })}
            className="w-full h-2 accent-orange-600 rounded-lg cursor-pointer my-2 bg-stone-200" 
          />
          <div className="flex justify-between text-stone-400 font-medium text-[10px]">
            <span>€200</span>
            <span>€500 ({t.averageWord})</span>
            <span>€900+</span>
          </div>
        </div>

        {/* Sort selector */}
        <div className="border-t border-stone-100 pt-4">
          <label className="font-semibold block mb-1.5 uppercase tracking-wide text-stone-600 text-[11px] flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-stone-500" />
            <span>{t.sortLabel}</span>
          </label>
          <select 
            id="select-sort-sidebar"
            value={filters.sortBy}
            onChange={(e) => onFilterChange({ sortBy: e.target.value as any })}
            className="w-full min-h-[42px] border border-stone-200 px-3 bg-stone-50/60 rounded-xl outline-none text-xs text-stone-900 cursor-pointer focus:bg-white focus:border-stone-400 transition-colors"
          >
            <option value="relevance">{t.sortRelevance}</option>
            <option value="compatibility-desc">{t.sortCompatDesc}</option>
            <option value="price-asc">{t.sortPriceAsc}</option>
            <option value="price-desc">{t.sortPriceDesc}</option>
            <option value="newest">{t.sortNewest}</option>
          </select>
        </div>

      </div>
    </aside>
  );
};
