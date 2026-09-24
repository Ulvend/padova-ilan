import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, DEFAULT_FILTERS, MAX_PRICE_UNLIMITED } from '../context/AppContext';
import { RecentlyAddedSection } from '../components/RecentlyAddedSection';
import { PadovaMap } from '../components/PadovaMap';
import { ListingCard } from '../components/ListingCard';
import { Pagination } from '../components/Pagination';
import { PADOVA_STATS } from '../data/mockData';
import { HOME_TEXT, fillText } from '../utils/homeText';
import {
  Map as MapIcon,
  LayoutGrid,
  SlidersHorizontal,
  Search,
  X,
  Video,
  Star,
  GraduationCap,
  Building2,
  RefreshCw,
  Scale,
  ChevronDown,
} from 'lucide-react';

// Tek sayfada gösterilen ilan sayısı.
export const PAGE_SIZE = 9;

const CONTRACT_STUDENT = 'Contratto per Studenti (Canone Concordato)';
const CONTRACT_SUBENTRO = 'Subentro (Resmi Sözleşme Devri)';

const fieldLabel = 'truncate text-[11px] font-bold uppercase tracking-[0.08em] text-stone-500';
const fieldSelect =
  'w-full bg-transparent text-[15px] font-semibold text-stone-900 outline-none cursor-pointer appearance-none pr-5 truncate';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    t,
    currentLang,
    publicListings,
    filteredListings,
    filters,
    setFilters,
    favoriteIds,
    handleToggleFavorite,
    isMapSectionOpen,
    setIsMapSectionOpen,
    setIsMobileFilterOpen,
    setPreviewModalListing,
    setVideoModalListing,
    handleOpenChat,
  } = useApp();
  const h = HOME_TEXT[currentLang] || HOME_TEXT.tr;
  const resultsRef = useRef<HTMLElement>(null);
  const [page, setPage] = useState(1);

  const handleOpenDetailPage = (listing: any) => {
    navigate(`/ilan/${listing.id}`);
  };

  const total = filteredListings.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const from = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const to = Math.min(total, currentPage * PAGE_SIZE);
  const pageListings = useMemo(
    () => filteredListings.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filteredListings, currentPage]
  );

  // Filtre veya ilan sayısı değişince ilk sayfaya dön.
  useEffect(() => {
    setPage(1);
  }, [filters, total]);

  const goToPage = (n: number) => {
    setPage(n);
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const update = (updates: Partial<typeof filters>) => setFilters((prev) => ({ ...prev, ...updates }));

  const activeFilterCount = [
    filters.categoryTab !== 'all',
    Boolean(filters.searchQuery),
    filters.contractType !== 'all',
    filters.district !== 'all',
    filters.maxPrice < MAX_PRICE_UNLIMITED,
    filters.onlyVideoTour,
    filters.onlyStudentVerified,
    filters.onlyHighCompatibility,
    filters.roomType !== 'all',
    Boolean(filters.contractStartDateFilter && filters.contractStartDateFilter !== 'all'),
  ].filter(Boolean).length;

  const [radarPrice, radarRoom] = PADOVA_STATS.averageSingolaPrice.split(' / ');

  const chip = (active: boolean) =>
    `min-h-[44px] px-4 rounded-full border text-sm font-semibold shrink-0 flex items-center gap-2 transition cursor-pointer active:scale-95 ${
      active ? 'bg-stone-900 border-stone-900 text-white' : 'bg-white text-stone-900 border-stone-300 hover:border-stone-500'
    }`;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="pt-2 sm:pt-6 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div className="max-w-2xl">
          <h1 className="font-display font-black text-[32px] sm:text-5xl lg:text-[60px] leading-[1.06] tracking-tight text-stone-900">
            {h.heroTitleA}
            <br className="hidden sm:block" /> {h.heroTitleB}
          </h1>
          <p className="mt-4 sm:mt-5 text-base sm:text-lg leading-relaxed text-stone-600 max-w-xl">{h.heroSub}</p>
        </div>

        <div className="hidden lg:flex w-80 shrink-0 flex-col gap-1.5 bg-white border border-stone-200 rounded-[20px] px-[22px] py-5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-700">
            <Scale className="w-4 h-4" />
            {h.radarLabel}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold tracking-tight text-stone-900">{radarPrice}</span>
            <span className="text-sm text-stone-500">{t.perMonth}</span>
          </div>
          <p className="text-sm leading-snug text-stone-600">
            {radarRoom} {h.radarNote}
          </p>
        </div>
      </section>

      {/* Masaüstü arama çubuğu */}
      <div className="hidden lg:flex items-stretch bg-white border border-stone-200 rounded-3xl shadow-[0_8px_24px_rgba(28,25,23,0.06)] p-2 pr-3.5 h-[88px]">
        <label className="flex-[1.4] px-6 flex flex-col justify-center gap-1 min-w-0 cursor-text">
          <span className={fieldLabel}>{h.searchField}</span>
          <div className="flex items-center gap-2">
            <input
              id="input-filter-search"
              type="text"
              value={filters.searchQuery}
              onChange={(e) => update({ searchQuery: e.target.value })}
              placeholder={t.searchPlaceholder}
              className="w-full bg-transparent text-[15px] font-semibold text-stone-900 placeholder:text-stone-400 placeholder:font-medium outline-none truncate"
            />
            {filters.searchQuery && (
              <button type="button" onClick={() => update({ searchQuery: '' })} className="shrink-0 text-stone-400 hover:text-stone-700" aria-label={t.clearSearch}>
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </label>

        <div className="w-px my-5 bg-stone-200" />
        <label className="flex-1 px-6 flex flex-col justify-center gap-1 min-w-0">
          <span className={fieldLabel}>{h.areaField}</span>
          <div className="relative">
            <select id="select-district" value={filters.district} onChange={(e) => update({ district: e.target.value })} className={fieldSelect}>
              <option value="all">{t.allAreas}</option>
              <option value="Policlinico / Tıp Fakültesi (< 500m)">{t.districtPoliclinico}</option>
              <option value="Portello / Mühendislik & Fen (< 500m)">{t.districtPortello}</option>
              <option value="Beato Pellegrino / Beşeri Bilimler">{t.districtBeato}</option>
              <option value="Centro Storico / Prato della Valle">{t.districtCentro}</option>
            </select>
            <ChevronDown className="w-4 h-4 text-stone-500 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </label>

        <div className="w-px my-5 bg-stone-200" />
        <label className="flex-1 px-6 flex flex-col justify-center gap-1 min-w-0">
          <span className={fieldLabel}>{t.roomTypeLabel}</span>
          <div className="relative">
            <select id="select-room-type" value={filters.roomType} onChange={(e) => update({ roomType: e.target.value })} className={fieldSelect}>
              <option value="all">{t.allRoomTypes}</option>
              <option value="Singola">{t.singleRoomOption}</option>
              <option value="Doppia">{t.doubleRoomOption}</option>
              <option value="Posto Letto">{t.sharedBedOption}</option>
              <option value="Monolocale">{t.studioOption}</option>
            </select>
            <ChevronDown className="w-4 h-4 text-stone-500 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </label>

        <div className="w-px my-5 bg-stone-200" />
        <label className="flex-1 px-6 flex flex-col justify-center gap-1 min-w-0">
          <span className={fieldLabel}>{t.contractStartDateLabel.split(' ').slice(0, 2).join(' ')}</span>
          <div className="relative">
            <select id="select-start-date" value={filters.contractStartDateFilter || 'all'} onChange={(e) => update({ contractStartDateFilter: e.target.value })} className={fieldSelect}>
              <option value="all">{t.allDates}</option>
              <option value="immediate">{t.contractStartImmediate}</option>
              <option value="october">{t.dateOctober}</option>
              <option value="november">{t.dateNovember}</option>
              <option value="spring">{t.dateSpring}</option>
            </select>
            <ChevronDown className="w-4 h-4 text-stone-500 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </label>

        <div className="w-px my-5 bg-stone-200" />
        <label className="w-[150px] px-6 flex flex-col justify-center gap-1">
          <span className={fieldLabel}>{h.maxRentField}</span>
          <div className="relative">
            <select id="select-max-price" value={filters.maxPrice} onChange={(e) => update({ maxPrice: Number(e.target.value) })} className={fieldSelect}>
              {[300, 400, 500, 600, 700, 800, MAX_PRICE_UNLIMITED].map((v) => (
                <option key={v} value={v}>
                  €{v}
                  {v === MAX_PRICE_UNLIMITED ? '+' : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-stone-500 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </label>

        <button
          type="button"
          onClick={() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          className="self-center h-[60px] px-8 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl text-base font-bold flex items-center gap-2.5 cursor-pointer transition active:scale-95"
        >
          <Search className="w-5 h-5 stroke-[2.4]" />
          {h.searchBtn}
        </button>
      </div>

      {/* Mobil arama + filtre */}
      <div className="lg:hidden flex items-center gap-2.5 -mt-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => update({ searchQuery: e.target.value })}
            placeholder={t.searchPlaceholder}
            className="w-full min-h-[52px] px-4 pl-11 text-base border border-stone-300 bg-white rounded-2xl outline-none focus:border-stone-500 text-stone-900"
          />
          <Search className="w-5 h-5 text-stone-900 absolute left-4 top-1/2 -translate-y-1/2" />
          {filters.searchQuery && (
            <button type="button" onClick={() => update({ searchQuery: '' })} className="w-10 h-10 rounded-full flex items-center justify-center absolute right-1 top-1/2 -translate-y-1/2 text-stone-400" aria-label={t.clearSearch}>
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setIsMobileFilterOpen(true)}
          className="relative w-[52px] h-[52px] bg-stone-900 text-white rounded-2xl flex items-center justify-center cursor-pointer shrink-0 active:scale-95"
          aria-label={h.allFilters}
        >
          <SlidersHorizontal className="w-[22px] h-[22px]" />
          {activeFilterCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 min-w-[22px] h-[22px] px-1 bg-orange-600 border-2 border-stone-100 text-white text-xs rounded-full flex items-center justify-center font-extrabold">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filtre çipleri */}
      <div className="-mt-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1 -mx-1 px-1 flex-1">
          <button type="button" onClick={() => update({ onlyVideoTour: !filters.onlyVideoTour })} className={chip(filters.onlyVideoTour)} aria-pressed={filters.onlyVideoTour}>
            <Video className="w-4 h-4" />
            {t.tabVideo}
          </button>
          <button type="button" onClick={() => update({ onlyStudentVerified: !filters.onlyStudentVerified })} className={chip(filters.onlyStudentVerified)} aria-pressed={filters.onlyStudentVerified}>
            <GraduationCap className="w-4 h-4" />
            {t.verifiedStudent}
          </button>
          <button type="button" onClick={() => update({ onlyHighCompatibility: !filters.onlyHighCompatibility })} className={chip(filters.onlyHighCompatibility)} aria-pressed={filters.onlyHighCompatibility}>
            <Star className="w-4 h-4" />
            {t.highCompatibility}
          </button>
          <button type="button" onClick={() => update({ contractType: filters.contractType === CONTRACT_STUDENT ? 'all' : CONTRACT_STUDENT })} className={chip(filters.contractType === CONTRACT_STUDENT)} aria-pressed={filters.contractType === CONTRACT_STUDENT}>
            {t.contractOptionStudent.split(' (')[0]}
          </button>
          <button type="button" onClick={() => update({ contractType: filters.contractType === CONTRACT_SUBENTRO ? 'all' : CONTRACT_SUBENTRO })} className={chip(filters.contractType === CONTRACT_SUBENTRO)} aria-pressed={filters.contractType === CONTRACT_SUBENTRO}>
            {t.tabSubentro}
          </button>
          <button type="button" onClick={() => update({ categoryTab: filters.categoryTab === 'roommates' ? 'all' : 'roommates' })} className={chip(filters.categoryTab === 'roommates')} aria-pressed={filters.categoryTab === 'roommates'}>
            {t.tabRoommates}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsMobileFilterOpen(true)}
          className="hidden lg:flex min-h-[44px] px-4 bg-white border border-stone-300 hover:border-stone-500 rounded-xl text-sm font-bold text-stone-900 items-center gap-2 cursor-pointer shrink-0"
        >
          <SlidersHorizontal className="w-4 h-4" />
          {h.allFilters}
          {activeFilterCount > 0 && <span className="bg-stone-900 text-white text-xs rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center">{activeFilterCount}</span>}
        </button>
      </div>

      {/* Son eklenenler (yatay kaydırmalı) */}
      <RecentlyAddedSection
        listings={publicListings}
        t={t}
        currentLang={currentLang}
        onOpenDetailPage={handleOpenDetailPage}
        onOpenPreviewModal={setPreviewModalListing}
      />

      {/* Tüm ilanlar */}
      <section ref={resultsRef} id="all-listings-section" className="scroll-mt-24 border-t border-stone-200 pt-8 sm:pt-10 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-stone-900">{h.allListingsTitle}</h2>
            <span className="text-sm text-stone-500" aria-live="polite">
              {pageCount > 1
                ? fillText(h.rangeSummary, { page: currentPage, pages: pageCount, from, to, total })
                : fillText(h.totalSummary, { total })}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <label className="relative flex items-center">
              <span className="sr-only">{t.sortLabel}</span>
              <select
                id="select-sort"
                value={filters.sortBy}
                onChange={(e) => update({ sortBy: e.target.value as any, categoryTab: filters.categoryTab === 'newest' ? 'all' : filters.categoryTab })}
                className="min-h-[44px] pl-3 pr-8 bg-transparent text-sm font-semibold text-stone-900 outline-none cursor-pointer appearance-none"
              >
                <option value="relevance">{t.sortRelevance}</option>
                <option value="compatibility-desc">{t.sortCompatDesc}</option>
                <option value="price-asc">{t.sortPriceAsc}</option>
                <option value="price-desc">{t.sortPriceDesc}</option>
                <option value="newest">{t.sortNewest}</option>
              </select>
              <ChevronDown className="w-4 h-4 text-stone-600 absolute right-2 pointer-events-none" />
            </label>

            <div className="flex p-1 bg-stone-200/70 rounded-xl" role="group" aria-label={h.viewToggle}>
              <button
                type="button"
                onClick={() => setIsMapSectionOpen(false)}
                aria-pressed={!isMapSectionOpen}
                className={`min-h-[36px] px-4 rounded-lg text-sm flex items-center gap-1.5 cursor-pointer transition ${!isMapSectionOpen ? 'bg-white font-bold text-stone-900 shadow-xs' : 'font-semibold text-stone-600'}`}
              >
                <LayoutGrid className="w-4 h-4" />
                {h.listView}
              </button>
              <button
                type="button"
                onClick={() => setIsMapSectionOpen(true)}
                aria-pressed={isMapSectionOpen}
                className={`min-h-[36px] px-4 rounded-lg text-sm flex items-center gap-1.5 cursor-pointer transition ${isMapSectionOpen ? 'bg-white font-bold text-stone-900 shadow-xs' : 'font-semibold text-stone-600'}`}
              >
                <MapIcon className="w-4 h-4" />
                {h.mapView}
              </button>
            </div>
          </div>
        </div>

        {isMapSectionOpen && (
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden p-3">
            <PadovaMap
              listings={filteredListings}
              onOpenDetailPage={handleOpenDetailPage}
              onOpenPreviewModal={setPreviewModalListing}
              currentLang={currentLang}
              height="420px"
            />
          </div>
        )}

        {total === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-stone-200 space-y-4">
            <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
              <Building2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-bold text-stone-800">{t.noListingsFoundTitle}</p>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">{t.noListingsFoundSubtitle}</p>
            </div>
            <button
              type="button"
              onClick={() => setFilters(DEFAULT_FILTERS)}
              className="inline-flex items-center gap-2 px-4 min-h-[44px] bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold rounded-xl transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{t.resetAllFilters}</span>
            </button>
          </div>
        ) : (
          <div className="grid gap-x-7 gap-y-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {pageListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isFavorite={favoriteIds.includes(listing.id)}
                onToggleFavorite={(e) => handleToggleFavorite(e, listing.id)}
                onOpenDetailPage={handleOpenDetailPage}
                onOpenVideoModal={(l) => setVideoModalListing(l)}
                onOpenPreviewModal={(l) => setPreviewModalListing(l)}
                onOpenChat={handleOpenChat}
                currentLang={currentLang}
              />
            ))}
          </div>
        )}

        <Pagination currentPage={currentPage} pageCount={pageCount} onChange={goToPage} currentLang={currentLang} />
      </section>
    </div>
  );
};
