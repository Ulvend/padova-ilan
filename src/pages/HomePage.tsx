import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, DEFAULT_FILTERS } from '../context/AppContext';
import { CategorySidebar } from '../components/CategorySidebar';
import { RecentlyAddedSection } from '../components/RecentlyAddedSection';
import { PadovaMap } from '../components/PadovaMap';
import { ListingCard } from '../components/ListingCard';
import { 
  Map, 
  ChevronDown, 
  ChevronUp, 
  Grid2X2, 
  List, 
  Filter, 
  Search, 
  X, 
  Video, 
  Star, 
  GraduationCap, 
  DoorClosed, 
  CircleDollarSign,
  Building2,
  RefreshCw
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    t,
    currentLang,
    listings,
    filteredListings,
    filters,
    setFilters,
    favoriteIds,
    handleToggleFavorite,
    gridLayout,
    setGridLayout,
    isMapSectionOpen,
    setIsMapSectionOpen,
    setIsMobileFilterOpen,
    setPreviewModalListing,
    setVideoModalListing,
    handleOpenChat,
  } = useApp();

  const handleOpenDetailPage = (listing: any) => {
    navigate(`/ilan/${listing.id}`);
  };

  const activeFilterCount = [
    filters.categoryTab !== 'all',
    Boolean(filters.searchQuery),
    filters.contractType !== 'all',
    filters.district !== 'all',
    filters.maxPrice < 900,
    filters.onlyVideoTour,
    filters.onlyStudentVerified,
    filters.onlyHighCompatibility,
    filters.roomType !== 'all',
  ].filter(Boolean).length;

  return (
    <div className="space-y-5">
      {/* Mobile Search, Filter & Quick Chips Strip */}
      <div className="lg:hidden space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
              placeholder={t.searchPlaceholder}
              className="w-full min-h-[46px] px-3.5 pl-10 text-base sm:text-xs border border-stone-200 bg-white rounded-xl outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 shadow-xs text-stone-900"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            {filters.searchQuery && (
              <button
                type="button"
                onClick={() => setFilters((prev) => ({ ...prev, searchQuery: '' }))}
                className="w-8 h-8 rounded-full flex items-center justify-center absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 font-bold"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsMobileFilterOpen(true)}
            className="min-h-[46px] px-3.5 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl font-semibold text-xs uppercase flex items-center gap-2 shadow-xs active:translate-y-0.5 cursor-pointer shrink-0 text-stone-800"
          >
            <Filter className="w-4 h-4 text-orange-600" />
            <span>{t.filterDeskTitle ? t.filterDeskTitle.split(' ')[0] : 'Filters'}</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 bg-orange-600 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Quick Thumb Horizontal Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-2 px-2">
          <button
            type="button"
            onClick={() => setFilters((prev) => ({ ...prev, onlyVideoTour: !prev.onlyVideoTour }))}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-xl border text-xs font-semibold shrink-0 flex items-center gap-1.5 active:scale-95 transition cursor-pointer ${
              filters.onlyVideoTour ? 'bg-purple-700 border-purple-700 text-white shadow-xs' : 'bg-white text-stone-700 border-stone-200 shadow-xs'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>{t.tabVideo || '360° Video'}</span>
          </button>

          <button
            type="button"
            onClick={() => setFilters((prev) => ({ ...prev, onlyHighCompatibility: !prev.onlyHighCompatibility }))}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-xl border text-xs font-semibold shrink-0 flex items-center gap-1.5 active:scale-95 transition cursor-pointer ${
              filters.onlyHighCompatibility ? 'bg-amber-600 border-amber-600 text-white shadow-xs' : 'bg-white text-stone-700 border-stone-200 shadow-xs'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            <span>{t.highCompatibility}</span>
          </button>

          <button
            type="button"
            onClick={() => setFilters((prev) => ({ ...prev, onlyStudentVerified: !prev.onlyStudentVerified }))}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-xl border text-xs font-semibold shrink-0 flex items-center gap-1.5 active:scale-95 transition cursor-pointer ${
              filters.onlyStudentVerified ? 'bg-emerald-700 border-emerald-700 text-white shadow-xs' : 'bg-white text-stone-700 border-stone-200 shadow-xs'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>{t.verifiedStudent}</span>
          </button>

          <button
            type="button"
            onClick={() => setFilters((prev) => ({ ...prev, roomType: prev.roomType === 'Singola' ? 'all' : 'Singola' }))}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-xl border text-xs font-semibold shrink-0 flex items-center gap-1.5 active:scale-95 transition cursor-pointer ${
              filters.roomType === 'Singola' ? 'bg-stone-900 border-stone-900 text-white shadow-xs' : 'bg-white text-stone-700 border-stone-200 shadow-xs'
            }`}
          >
            <DoorClosed className="w-3.5 h-3.5" />
            <span>{t.roomSingola}</span>
          </button>

          <button
            type="button"
            onClick={() => setFilters((prev) => ({ ...prev, maxPrice: prev.maxPrice <= 450 ? 900 : 450 }))}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-xl border text-xs font-semibold shrink-0 flex items-center gap-1.5 active:scale-95 transition cursor-pointer ${
              filters.maxPrice <= 450 ? 'bg-stone-900 border-stone-900 text-white shadow-xs' : 'bg-white text-stone-700 border-stone-200 shadow-xs'
            }`}
          >
            <CircleDollarSign className="w-3.5 h-3.5" />
            <span>&lt;€450</span>
          </button>
        </div>
      </div>

      {/* Son Yüklenen İlanlar Vitrini */}
      <RecentlyAddedSection
        listings={listings}
        t={t}
        onOpenDetailPage={handleOpenDetailPage}
        onOpenPreviewModal={setPreviewModalListing}
      />

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Filter & Search Desk (Visible only on Desktop lg+) */}
        <aside className="hidden lg:block lg:col-span-4 xl:col-span-3 lg:sticky lg:top-20 space-y-5">
          <CategorySidebar
            filters={filters}
            onFilterChange={(updates) => setFilters((prev) => ({ ...prev, ...updates }))}
            onResetFilters={() => setFilters(DEFAULT_FILTERS)}
            currentLang={currentLang}
          />
        </aside>

        {/* Right Column: Listings Feed */}
        <section className="col-span-1 lg:col-span-8 xl:col-span-9 space-y-5">
          {/* Expandable/Collapsible Padova Map Section */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <div 
              onClick={() => setIsMapSectionOpen(!isMapSectionOpen)}
              className="p-3.5 bg-white hover:bg-stone-50/70 flex items-center justify-between gap-3 cursor-pointer select-none transition"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsMapSectionOpen(!isMapSectionOpen);
                }
              }}
            >
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl border transition-colors ${isMapSectionOpen ? 'bg-orange-600 text-white border-orange-600' : 'bg-stone-100 text-stone-800 border-stone-200'}`}>
                  <Map className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs sm:text-sm text-stone-900 uppercase tracking-tight">
                      {t.padovaMapTitle}
                    </span>
                    <span className="bg-amber-50 border border-amber-200 text-[10px] font-semibold px-2 py-0.5 rounded-full text-amber-900">
                      {filteredListings.length} {t.listingsAndCampuses}
                    </span>
                    <span className="text-[10px] text-stone-400 font-medium hidden sm:inline">
                      (OpenStreetMap)
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 font-normal hidden sm:block">
                    {t.mapDescription}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMapSectionOpen(!isMapSectionOpen);
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition cursor-pointer flex items-center gap-1.5 ${
                    isMapSectionOpen 
                      ? 'bg-stone-900 text-white border-stone-900' 
                      : 'bg-orange-600 text-white border-orange-600 hover:bg-orange-700'
                  }`}
                >
                  <span>{isMapSectionOpen ? t.hideMap : t.showMap}</span>
                  {isMapSectionOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Collapsible OpenStreetMap View */}
            {isMapSectionOpen && (
              <div className="p-3 bg-stone-50 border-t border-stone-200">
                <PadovaMap
                  listings={filteredListings}
                  onOpenDetailPage={handleOpenDetailPage}
                  onOpenPreviewModal={setPreviewModalListing}
                  currentLang={currentLang}
                  height="420px"
                />
              </div>
            )}
          </div>

          {/* Feed Count Header & Layout Mode Switcher */}
          <div className="flex flex-wrap items-center justify-between px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-700 shadow-xs gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-stone-900 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
                <span>{filteredListings.length} {t.activeStudentListings}</span>
              </span>
              {filters.categoryTab === 'newest' && (
                <span className="text-[10px] bg-orange-100 border border-orange-300 px-2 py-0.5 text-orange-900 font-bold rounded-full">
                  {currentLang === 'tr' ? 'Son Eklenen 8 İlan' :
                   currentLang === 'it' ? 'Ultimi 8 Annunci' :
                   'Latest 8 Listings'}
                </span>
              )}
            </div>

            {/* Grid Layout Switcher */}
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setGridLayout('double')}
                className={`p-1.5 rounded-md transition cursor-pointer flex items-center gap-1 text-xs ${
                  gridLayout === 'double'
                    ? 'bg-white text-stone-900 shadow-xs font-semibold'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
                title={t.twoColumnsMode}
              >
                <Grid2X2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">{t.doubleGrid}</span>
              </button>

              <button
                type="button"
                onClick={() => setGridLayout('single')}
                className={`p-1.5 rounded-md transition cursor-pointer flex items-center gap-1 text-xs ${
                  gridLayout === 'single'
                    ? 'bg-white text-stone-900 shadow-xs font-semibold'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
                title={t.singleColumnMode}
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">{t.singleGrid}</span>
              </button>
            </div>
          </div>

          {/* Listings Grid */}
          {filteredListings.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-4">
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
                className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{t.resetAllFilters}</span>
              </button>
            </div>
          ) : (
            <div
              className={`grid gap-4 sm:gap-5 ${
                gridLayout === 'single'
                  ? 'grid-cols-1'
                  : 'grid-cols-1 md:grid-cols-2'
              }`}
            >
              {filteredListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  isFavorite={favoriteIds.includes(listing.id)}
                  onToggleFavorite={(e) => handleToggleFavorite(e, listing.id)}
                  onFavoriteToggle={(e) => handleToggleFavorite(e, listing.id)}
                  onOpenDetailPage={handleOpenDetailPage}
                  onSelectListing={handleOpenDetailPage}
                  onOpenVideoModal={(l) => setVideoModalListing(l)}
                  onOpenVideoTour={(l) => setVideoModalListing(l)}
                  onOpenPreviewModal={(l) => setPreviewModalListing(l)}
                  onOpenChat={handleOpenChat}
                  currentLang={currentLang}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
