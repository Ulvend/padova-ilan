import { useModalBehavior } from '../utils/useModalBehavior';
import React from 'react';
import { MAX_PRICE_UNLIMITED } from '../context/AppContext';
import { X, RotateCcw, Video, Check, ArrowUpDown, Filter, GraduationCap, Calendar, Hourglass, Users } from 'lucide-react';
import { StartDatePanel } from './StartDateFilter';
import { FilterState, Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';

const optionChip = (active: boolean) =>
  `min-h-[40px] px-3.5 rounded-full border text-xs font-semibold transition cursor-pointer active:scale-95 ${
    active ? 'bg-stone-900 border-stone-900 text-white' : 'bg-white text-stone-800 border-stone-300 hover:border-stone-500'
  }`;

interface MobileFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onFilterChange: (updates: Partial<FilterState>) => void;
  onResetFilters: () => void;
  filteredCount: number;
  currentLang: Language;
}

export const MobileFilterDrawer: React.FC<MobileFilterDrawerProps> = ({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  onResetFilters,
  filteredCount,
  currentLang,
}) => {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.it;

  useModalBehavior(isOpen, onClose);

  if (!isOpen) return null;

  const stayOptions = [
    { months: 0, label: t.stayAny },
    { months: 1, label: t.stayUpTo1 },
    { months: 3, label: t.stayUpTo3 },
    { months: 6, label: t.stayUpTo6 },
  ];

  const genderOptions: { value: FilterState['genderFilter']; label: string }[] = [
    { value: undefined, label: t.genderFilterAny },
    { value: 'female', label: t.genderFilterFemale },
    { value: 'male', label: t.genderFilterMale },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex flex-col justify-end lg:justify-center lg:items-center animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-white border-t lg:border border-stone-200 w-full lg:max-w-2xl max-h-[88vh] flex flex-col shadow-2xl rounded-t-3xl lg:rounded-3xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle & Header */}
        <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-orange-100 rounded-xl text-orange-800">
              <Filter className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base text-stone-900 uppercase tracking-tight">
                {t.filterDeskTitle}
              </h2>
              <span className="text-[11px] text-stone-500 font-medium">
                {filteredCount} {t.activeStudentListings}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onResetFilters}
              className="text-xs text-stone-500 hover:text-stone-900 font-semibold flex items-center gap-1 px-3 py-1.5 border border-stone-200 rounded-xl active:bg-stone-100"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.resetFilters}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl border border-stone-200 bg-white flex items-center justify-center font-bold text-sm text-stone-600 hover:text-stone-900 active:bg-stone-100 cursor-pointer"
              title={t.closeBtn}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body with Generous Air & Thumb Targets */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-sm">
          
          {/* Quick Search */}
          <div className="space-y-1.5">
            <label className="font-semibold text-xs uppercase tracking-wide text-stone-600 block">
              {t.searchLabel}
            </label>
            <input 
              type="text" 
              value={filters.searchQuery}
              onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
              placeholder={t.searchPlaceholder} 
              className="w-full min-h-[46px] px-3.5 text-base sm:text-xs border border-stone-200 bg-stone-50/50 rounded-xl outline-none focus:bg-white focus:border-stone-400 text-stone-900 transition-colors"
            />
          </div>

          {/* Area & Faculty Proximity */}
          <div className="space-y-1.5 border-t border-stone-100 pt-4">
            <label className="font-semibold text-xs uppercase tracking-wide text-stone-600 block">
              {t.areaProximityLabel}
            </label>
            <select 
              value={filters.district}
              onChange={(e) => onFilterChange({ district: e.target.value })}
              className="w-full min-h-[46px] px-3 text-xs border border-stone-200 bg-stone-50/50 rounded-xl outline-none text-stone-900 cursor-pointer focus:bg-white focus:border-stone-400 transition-colors"
            >
              <option value="all">{t.allAreas}</option>
              <option value="Policlinico / Tıp Fakültesi (< 500m)">{t.districtPoliclinico}</option>
              <option value="Portello / Mühendislik & Fen (< 500m)">{t.districtPortello}</option>
              <option value="Beato Pellegrino / Beşeri Bilimler">{t.districtBeato}</option>
              <option value="Centro Storico / Prato della Valle">{t.districtCentro}</option>
            </select>
          </div>

          {/* Room Type */}
          <div className="space-y-1.5 border-t border-stone-100 pt-4">
            <label className="font-semibold text-xs uppercase tracking-wide text-stone-600 block">
              {t.roomTypeLabel}
            </label>
            <select 
              value={filters.roomType}
              onChange={(e) => onFilterChange({ roomType: e.target.value })}
              className="w-full min-h-[46px] px-3 text-xs border border-stone-200 bg-stone-50/50 rounded-xl outline-none text-stone-900 cursor-pointer focus:bg-white focus:border-stone-400 transition-colors"
            >
              <option value="all">{t.allRoomTypes}</option>
              <option value="Singola">{t.singleRoomOption}</option>
              <option value="Doppia">{t.doubleRoomOption}</option>
              <option value="Monolocale">{t.studioOption}</option>
              <option value="Bilocale">{t.bilocaleOption}</option>
            </select>
          </div>

          {/* Cinsiyet: seçilen cinsiyete açık ilanlar (karma evler dahil) */}
          <div className="space-y-1.5 border-t border-stone-100 pt-4">
            <label className="font-semibold text-xs uppercase tracking-wide text-stone-600 block flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-orange-600" />
              <span>{t.genderFilterLabel}</span>
            </label>
            <div className="flex flex-wrap gap-2" role="group" aria-label={t.genderFilterLabel}>
              {genderOptions.map(({ value, label }) => {
                const active = filters.genderFilter === value;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => onFilterChange({ genderFilter: value })}
                    aria-pressed={active}
                    className={optionChip(active)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-stone-500 leading-relaxed">{t.genderFilterHint}</p>
          </div>

          {/* Contract Start Date */}
          <div className="space-y-1.5 border-t border-stone-100 pt-4">
            <label className="font-semibold text-xs uppercase tracking-wide text-stone-600 block flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-orange-600" />
              <span>{t.contractStartDateLabel}</span>
            </label>
            <StartDatePanel filters={filters} onFilterChange={onFilterChange} currentLang={currentLang} />
          </div>

          {/* Kiralama süresi (kısa dönem) */}
          <div className="space-y-1.5 border-t border-stone-100 pt-4">
            <label className="font-semibold text-xs uppercase tracking-wide text-stone-600 block flex items-center gap-1.5">
              <Hourglass className="w-3.5 h-3.5 text-orange-600" />
              <span>{t.stayLabel}</span>
            </label>
            <div className="flex flex-wrap gap-2" role="group" aria-label={t.stayLabel}>
              {stayOptions.map(({ months, label }) => {
                const active = (filters.maxStayMonths || 0) === months;
                return (
                  <button
                    key={months}
                    type="button"
                    onClick={() => onFilterChange({ maxStayMonths: months || undefined })}
                    aria-pressed={active}
                    className={optionChip(active)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-stone-500 leading-relaxed">{t.stayHint}</p>
          </div>

          {/* Budget Slider with Large Touch Area */}
          <div className="space-y-2 border-t border-stone-100 pt-4">
            <div className="flex justify-between items-center">
              <label className="font-semibold text-xs uppercase tracking-wide text-stone-600">
                {t.budgetLabel}
              </label>
              <span className="font-bold text-orange-700 bg-orange-50 px-2.5 py-0.5 rounded-md text-xs border border-orange-200">
                {t.maxBudgetPrefix} €{filters.maxPrice}{filters.maxPrice >= MAX_PRICE_UNLIMITED ? '+' : ''}
              </span>
            </div>
            <input 
              type="range" 
              min="200" 
              max={MAX_PRICE_UNLIMITED} 
              step="25" 
              value={filters.maxPrice}
              onChange={(e) => onFilterChange({ maxPrice: Number(e.target.value) })}
              className="w-full h-2.5 accent-orange-600 bg-stone-200 rounded-lg cursor-pointer my-2" 
            />
            <div className="flex justify-between text-stone-400 font-medium text-xs">
              <span>€200</span>
              <span>€500</span>
              <span>€900+</span>
            </div>
          </div>

          {/* Verification & Trust Toggles (Thumb-First Big Clickable Cards) */}
          <div className="space-y-2.5 border-t border-stone-100 pt-4">
            <label className="font-semibold text-xs uppercase tracking-wide text-stone-600 block">
              {t.shieldLabel}
            </label>
            
            {/* 360 Video Card */}
            <div 
              onClick={() => onFilterChange({ onlyVideoTour: !filters.onlyVideoTour })}
              className={`min-h-[48px] p-3 rounded-xl border flex items-center justify-between cursor-pointer transition select-none ${
                filters.onlyVideoTour ? 'bg-purple-50 border-purple-300 shadow-xs' : 'bg-white border-stone-200 hover:bg-stone-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Video className="w-5 h-5 text-purple-700 shrink-0" />
                <span className="font-semibold text-xs text-stone-800">{t.videoShieldOption}</span>
              </div>
              <div className={`w-6 h-6 rounded-lg border flex items-center justify-center ${
                filters.onlyVideoTour ? 'bg-purple-700 border-purple-700 text-white' : 'border-stone-300 bg-stone-50'
              }`}>
                {filters.onlyVideoTour && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>

            {/* UniPD Student Card */}
            <div 
              onClick={() => onFilterChange({ onlyStudentVerified: !filters.onlyStudentVerified })}
              className={`min-h-[48px] p-3 rounded-xl border flex items-center justify-between cursor-pointer transition select-none ${
                filters.onlyStudentVerified ? 'bg-emerald-50 border-emerald-300 shadow-xs' : 'bg-white border-stone-200 hover:bg-stone-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <GraduationCap className="w-5 h-5 text-emerald-700 shrink-0" />
                <span className="font-semibold text-xs text-stone-800">{t.studentIdShieldOption}</span>
              </div>
              <div className={`w-6 h-6 rounded-lg border flex items-center justify-center ${
                filters.onlyStudentVerified ? 'bg-emerald-700 border-emerald-700 text-white' : 'border-stone-300 bg-stone-50'
              }`}>
                {filters.onlyStudentVerified && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>
          </div>

          {/* Contract Type */}
          <div className="space-y-1.5 border-t border-stone-100 pt-4">
            <label className="font-semibold text-xs uppercase tracking-wide text-stone-600 block">
              {t.contractTypeLabel}
            </label>
            <select 
              value={filters.contractType}
              onChange={(e) => onFilterChange({ contractType: e.target.value })}
              className="w-full min-h-[46px] px-3 text-xs border border-stone-200 bg-stone-50/50 rounded-xl outline-none text-stone-900 cursor-pointer focus:bg-white focus:border-stone-400 transition-colors"
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
          </div>

          {/* Sorting */}
          <div className="space-y-1.5 border-t border-stone-100 pt-4">
            <label className="font-semibold text-xs uppercase tracking-wide text-stone-600 block flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" />
              {t.sortLabel}
            </label>
            <select 
              value={filters.sortBy}
              onChange={(e) => onFilterChange({ sortBy: e.target.value as any })}
              className="w-full min-h-[46px] px-3 text-xs border border-stone-200 bg-stone-50/50 rounded-xl outline-none text-stone-900 cursor-pointer focus:bg-white focus:border-stone-400 transition-colors"
            >
              <option value="relevance">{t.sortRelevance}</option>
              <option value="price-asc">{t.sortPriceAsc}</option>
              <option value="price-desc">{t.sortPriceDesc}</option>
              <option value="newest">{t.sortNewest}</option>
              <option value="area-desc">{t.sortAreaDesc}</option>
              <option value="ppm-asc">{t.sortPricePerM2Asc}</option>
            </select>
          </div>

        </div>

        {/* Sticky Bottom Thumb Action Bar */}
        <div className="p-4 border-t border-stone-200 bg-white shrink-0 flex items-center gap-3">
          <button
            type="button"
            onClick={onResetFilters}
            className="px-4 min-h-[48px] border border-stone-200 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs uppercase rounded-xl active:scale-95 transition"
          >
            {t.resetFilters}
          </button>
          
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-[48px] bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm uppercase rounded-xl shadow-sm active:translate-y-0.5 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{filteredCount} {t.activeStudentListings}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
