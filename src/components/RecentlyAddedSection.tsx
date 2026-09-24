import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { HousingListing, Language } from '../types';
import { formatDeviceRelativeDate } from '../utils/deviceTime';
import { FullDictionary } from '../utils/translations';
import { HOME_TEXT } from '../utils/homeText';

interface RecentlyAddedSectionProps {
  listings: HousingListing[];
  t: FullDictionary;
  currentLang?: string;
  onOpenDetailPage: (listing: HousingListing) => void;
  onOpenPreviewModal?: (listing: HousingListing) => void;
}

export const RecentlyAddedSection: React.FC<RecentlyAddedSectionProps> = ({
  listings,
  t,
  currentLang,
  onOpenDetailPage,
  onOpenPreviewModal,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const h = HOME_TEXT[(currentLang as Language) || 'tr'] || HOME_TEXT.tr;

  // Son yüklenen ilanlara sadece son eklenen 8 ilan konulabilsin (strictly max 8 newest listings)
  const createdMs = (l: HousingListing) => {
    const ms = Date.parse(l.createdAt);
    return isNaN(ms) ? 0 : ms;
  };
  const recentListings = [...listings].sort((a, b) => createdMs(b) - createdMs(a)).slice(0, 8);

  const scroll = (direction: 'left' | 'right') => {
    scrollContainerRef.current?.scrollBy({ left: direction === 'left' ? -320 : 320, behavior: 'smooth' });
  };

  if (recentListings.length === 0) return null;

  return (
    <section id="recently-added-listings-section" aria-labelledby="recent-title" className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 id="recent-title" className="font-display font-bold text-2xl sm:text-3xl text-stone-900">
            {h.recentTitle}
          </h2>
          <span className="px-2.5 py-1 bg-orange-50 border border-orange-300 rounded-lg text-xs font-bold text-orange-800">
            {h.newBadge}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            id="scroll-recent-left"
            onClick={() => scroll('left')}
            className="w-11 h-11 rounded-full bg-white border border-stone-300 hover:border-stone-500 flex items-center justify-center text-stone-900 transition cursor-pointer"
            aria-label={t.scrollLeft}
          >
            <ChevronLeft className="w-[18px] h-[18px]" />
          </button>
          <button
            type="button"
            id="scroll-recent-right"
            onClick={() => scroll('right')}
            className="w-11 h-11 rounded-full bg-stone-900 border border-stone-900 hover:bg-stone-800 flex items-center justify-center text-white transition cursor-pointer"
            aria-label={t.scrollRight}
          >
            <ChevronRight className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        id="recent-listings-carousel"
        className="flex gap-5 overflow-x-auto pb-2 no-scrollbar scroll-smooth snap-x snap-mandatory -mx-1 px-1"
      >
        {recentListings.map((listing) => (
          <article
            key={listing.id}
            id={`recent-card-${listing.id}`}
            className="group w-[260px] sm:w-[300px] shrink-0 snap-start bg-white border border-stone-200 rounded-[20px] overflow-hidden flex flex-col hover:shadow-md transition-shadow"
          >
            <div className="relative h-[170px] sm:h-[180px] bg-stone-100 cursor-pointer" onClick={() => onOpenDetailPage(listing)}>
              <img
                src={listing.images[0] || 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=500&q=80'}
                alt={listing.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <span className="absolute left-3 top-3 h-7 px-2.5 bg-white rounded-full text-xs font-bold text-stone-900 flex items-center">
                {createdMs(listing) ? formatDeviceRelativeDate(createdMs(listing), currentLang) : h.newBadge}
              </span>
              {onOpenPreviewModal && (
                <button
                  type="button"
                  id={`preview-btn-${listing.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenPreviewModal(listing);
                  }}
                  className="absolute right-2.5 bottom-2 h-11 px-3.5 bg-white text-stone-900 rounded-full shadow-md flex items-center gap-2 text-sm font-bold cursor-pointer hover:bg-stone-50 transition"
                >
                  <Eye className="w-4 h-4" />
                  {t.quickPreview}
                </button>
              )}
            </div>

            <div className="px-[18px] pt-4 pb-[18px] space-y-1.5 cursor-pointer" onClick={() => onOpenDetailPage(listing)}>
              <div className="flex items-baseline gap-1.5">
                <span id={`recent-card-price-${listing.id}`} className="text-2xl font-extrabold tracking-tight text-stone-900">
                  €{listing.price}
                </span>
                <span className="text-[13px] text-stone-500">{t.perMonth}</span>
              </div>
              <h3
                id={`recent-card-title-${listing.id}`}
                className="text-base font-bold leading-snug text-stone-900 group-hover:text-orange-700 transition-colors line-clamp-1"
                title={listing.title}
              >
                {listing.title}
              </h3>
              <p className="text-[13px] text-stone-600 truncate">{listing.streetAddress || listing.district.split('/')[0].trim()}</p>
              <p className="text-[13px] text-stone-500 truncate">
                {listing.roomType} · {listing.roomM2} m² · {listing.bathrooms} {t.bathroomsNumber}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
