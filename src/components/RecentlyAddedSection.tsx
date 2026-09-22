import React, { useRef } from 'react';
import { 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  MapPin, 
  ShieldCheck, 
  Video, 
  Clock
} from 'lucide-react';
import { HousingListing } from '../types';
import { TranslationDictionary } from '../utils/translations';

interface RecentlyAddedSectionProps {
  listings: HousingListing[];
  t: TranslationDictionary;
  onOpenDetailPage: (listing: HousingListing) => void;
  onOpenPreviewModal?: (listing: HousingListing) => void;
}

export const RecentlyAddedSection: React.FC<RecentlyAddedSectionProps> = ({
  listings,
  t,
  onOpenDetailPage,
  onOpenPreviewModal,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Son yüklenen ilanlara sadece son eklenen 8 ilan konulabilsin (strictly max 8 newest listings)
  const recentListings = [...listings]
    .sort((a, b) => {
      if (a.createdAt === 'Şimdi' && b.createdAt !== 'Şimdi') return -1;
      if (b.createdAt === 'Şimdi' && a.createdAt !== 'Şimdi') return 1;
      return 0;
    })
    .slice(0, 8);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -230 : 230;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (recentListings.length === 0) return null;

  return (
    <section 
      id="recently-added-listings-section" 
      className="mb-4 bg-gradient-to-r from-orange-50/60 via-amber-50/30 to-stone-50/70 border border-orange-200/70 rounded-xl p-3 sm:p-3.5 shadow-2xs"
    >
      {/* Section Header - Compact */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-orange-600 text-white flex items-center justify-center shadow-2xs shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-xs sm:text-sm font-bold text-stone-900 tracking-tight">
              {t.recentlyAddedTitle}
            </h2>
            <span className="bg-orange-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
              {t.recentlyAddedBadge} ({recentListings.length}/8)
            </span>
          </div>
        </div>

        {/* Compact Scroll Arrows */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            id="scroll-recent-left"
            onClick={() => scroll('left')}
            className="w-7 h-7 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 flex items-center justify-center text-stone-600 transition cursor-pointer shadow-2xs"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            id="scroll-recent-right"
            onClick={() => scroll('right')}
            className="w-7 h-7 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 flex items-center justify-center text-stone-600 transition cursor-pointer shadow-2xs"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Horizontal Cards Reel with Listing Name and Price - Scaled Down & Sleek */}
      <div 
        ref={scrollContainerRef}
        id="recent-listings-carousel"
        className="flex gap-2.5 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar scroll-smooth snap-x snap-mandatory"
      >
        {recentListings.map((listing) => (
          <div
            key={listing.id}
            id={`recent-card-${listing.id}`}
            onClick={() => onOpenDetailPage(listing)}
            className="group relative bg-white border border-stone-200 hover:border-orange-400 rounded-lg p-2.5 shadow-2xs hover:shadow-sm transition-all duration-200 w-[190px] sm:w-[210px] shrink-0 snap-start flex flex-col justify-between cursor-pointer"
          >
            {/* Top Image + Badges */}
            <div>
              <div className="relative aspect-[16/10] rounded-md overflow-hidden mb-2 bg-stone-100">
                <img
                  src={listing.images[0] || 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=500&q=80'}
                  alt={listing.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />

                {/* Newly Added Pill */}
                <div className="absolute top-1.5 left-1.5 flex items-center gap-0.5 bg-stone-900/80 backdrop-blur-xs text-white text-[9px] font-semibold px-1.5 py-0.5 rounded shadow-xs">
                  <Clock className="w-2.5 h-2.5 text-orange-400" />
                  <span>{listing.createdAt || 'Yeni'}</span>
                </div>

                {/* Quick Preview Button */}
                {onOpenPreviewModal && (
                  <button
                    type="button"
                    id={`preview-btn-${listing.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenPreviewModal(listing);
                    }}
                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-white/90 hover:bg-white text-stone-700 hover:text-orange-600 rounded shadow-xs flex items-center justify-center transition cursor-pointer"
                    title={t.quickPreview}
                  >
                    <Eye className="w-3 h-3" />
                  </button>
                )}

                {/* Key feature badges over image */}
                <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between text-[9px]">
                  <span className="bg-white/95 text-stone-800 font-bold px-1.5 py-0.2 rounded shadow-2xs">
                    {listing.roomType}
                  </span>
                  <div className="flex items-center gap-1">
                    {listing.hasVideoTour && (
                      <span className="bg-purple-700/90 text-white px-1 py-0.2 rounded font-bold flex items-center gap-0.5">
                        <Video className="w-2 h-2" />
                        <span>360°</span>
                      </span>
                    )}
                    {listing.isStudentCardVerified && (
                      <span className="bg-emerald-700/90 text-white px-1 py-0.2 rounded font-bold flex items-center gap-0.5">
                        <ShieldCheck className="w-2 h-2" />
                        <span>UniPD</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* District & Location */}
              <div className="flex items-center gap-1 text-[10px] text-stone-500 font-medium mb-1 truncate">
                <MapPin className="w-2.5 h-2.5 text-stone-400 shrink-0" />
                <span className="truncate">{listing.district.split('/')[0].trim()}</span>
              </div>

              {/* İLANIN ADI (Listing Title) */}
              <h3 
                id={`recent-card-title-${listing.id}`}
                className="font-bold text-xs text-stone-900 group-hover:text-orange-600 transition-colors line-clamp-2 min-h-[32px] leading-tight"
                title={listing.title}
              >
                {listing.title}
              </h3>
            </div>

            {/* İLANIN FİYATI (Listing Price) */}
            <div className="mt-2 pt-2 border-t border-stone-100 flex items-baseline justify-between">
              <div>
                <span className="text-[9px] text-stone-400 block font-medium uppercase tracking-wider">
                  {t.monthlyRent}
                </span>
                <div className="flex items-baseline gap-0.5">
                  <span 
                    id={`recent-card-price-${listing.id}`}
                    className="text-sm sm:text-base font-extrabold text-stone-900 group-hover:text-orange-600 transition-colors"
                  >
                    €{listing.price}
                  </span>
                  <span className="text-[10px] text-stone-500 font-medium">
                    {t.perMonth}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                  {listing.expenses}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
