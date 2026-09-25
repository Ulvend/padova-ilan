import React from 'react';
import { Heart, Video, MapPin, Eye, ShieldCheck, GraduationCap, Users, Camera } from 'lucide-react';
import { HousingListing, Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { HOME_TEXT } from '../utils/homeText';
import { getLocalizedListing } from '../utils/listingTranslator';
import { useApp } from '../context/AppContext';
import { formatGenderDistribution } from '../utils/genderDistribution';
import { formatBathrooms, listingAreaM2 } from '../utils/format';

interface ListingCardProps {
  listing: HousingListing;
  isFavorite: boolean;
  onToggleFavorite?: (e: React.MouseEvent, listingId: string) => void;
  onFavoriteToggle?: (e: React.MouseEvent, listingId: string) => void;
  onOpenDetailPage?: (listing: HousingListing) => void;
  onSelectListing?: (listing: HousingListing) => void;
  onOpenPreviewModal: (listing: HousingListing) => void;
  onOpenVideoModal?: (listing: HousingListing) => void;
  onOpenVideoTour?: (listing: HousingListing) => void;
  onOpenChat?: (user: string, subject: string, listingId?: string) => void;
  currentLang?: Language;
  layoutMode?: 'single' | 'double';
}

export const ListingCard: React.FC<ListingCardProps> = ({
  listing: rawListing,
  isFavorite,
  onToggleFavorite,
  onFavoriteToggle,
  onOpenDetailPage,
  onSelectListing,
  onOpenPreviewModal,
  onOpenVideoModal,
  onOpenVideoTour,
  currentLang = 'tr',
}) => {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.tr;
  const h = HOME_TEXT[currentLang] || HOME_TEXT.tr;
  const { getPriceInsight } = useApp();
  const insight = getPriceInsight(rawListing);
  const listing = getLocalizedListing(rawListing, currentLang, insight);

  const handleToggleFav = (e: React.MouseEvent) => {
    e.stopPropagation();
    const fn = onToggleFavorite || onFavoriteToggle;
    if (fn) fn(e, listing.id);
  };

  const handleOpenDetail = () => {
    const fn = onOpenDetailPage || onSelectListing;
    if (fn) fn(rawListing);
  };

  const handleOpenVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    const fn = onOpenVideoModal || onOpenVideoTour;
    if (fn) fn(rawListing);
    else onOpenPreviewModal(rawListing);
  };

  const isPricey = listing.fairPriceStatus !== 'lower' && listing.fairPriceStatus !== 'average';
  const isVerified = Boolean(listing.poster.verifiedUniPD || listing.isStudentCardVerified);
  const hasGender = Boolean(listing.femaleCount || listing.maleCount);
  const occupants =
    listing.occupantType === 'students_only'
      ? t.occupantsStudentsOnly
      : listing.occupantType === 'workers_only'
      ? t.occupantsWorkersOnly
      : listing.occupantType
      ? t.occupantsMixed
      : '';
  const matesLine = [hasGender ? formatGenderDistribution(listing.femaleCount, listing.maleCount, t) : '', occupants]
    .filter(Boolean)
    .join(' · ');

  const chipCls = 'px-2.5 py-1 bg-stone-100 rounded-lg text-xs font-semibold text-stone-700';

  return (
    <article
      id={`housing-card-${listing.id}`}
      className="bg-white rounded-2xl border border-stone-200 overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow"
    >
      {/* Fotoğraf */}
      <div
        className="relative aspect-[3/2] bg-stone-200 cursor-pointer shrink-0"
        onClick={handleOpenDetail}
      >
        {listing.images && listing.images.length > 0 ? (
          <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-400">
            <Camera className="w-10 h-10" />
          </div>
        )}

        {listing.hasVideoTour && (
          <button
            type="button"
            onClick={handleOpenVideo}
            className="absolute left-3 top-3 h-7 px-2.5 bg-white rounded-full text-xs font-bold text-stone-900 flex items-center gap-1.5 cursor-pointer hover:bg-stone-50 transition"
          >
            <Video className="w-3.5 h-3.5" />
            {h.videoTour30}
          </button>
        )}

        <button
          type="button"
          onClick={handleToggleFav}
          className="absolute right-2.5 top-2.5 w-11 h-11 flex items-center justify-center cursor-pointer"
          title={isFavorite ? t.unfavorite : t.favorite}
          aria-label={isFavorite ? t.unfavorite : t.favorite}
          aria-pressed={isFavorite}
        >
          <span className="w-9 h-9 rounded-full bg-stone-900/45 flex items-center justify-center backdrop-blur-[2px]">
            <Heart className={`w-[18px] h-[18px] ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-white'}`} />
          </span>
        </button>

        {listing.images && listing.images.length > 0 && (
          <span className="absolute left-3 bottom-3 h-6 px-2 bg-stone-900/70 text-white text-[11px] font-semibold rounded-full flex items-center">
            {listing.images.length} {h.photoWord}
          </span>
        )}

        <button
          type="button"
          id={`btn-card-preview-${listing.id}`}
          onClick={(e) => {
            e.stopPropagation();
            onOpenPreviewModal(rawListing);
          }}
          className="absolute right-2.5 bottom-2.5 h-10 px-3.5 bg-white text-stone-900 rounded-full shadow-md flex items-center gap-1.5 text-[13px] font-bold cursor-pointer hover:bg-stone-50 transition active:scale-95"
          title={t.quickPreview}
        >
          <Eye className="w-4 h-4" />
          {t.quickPreview}
        </button>
      </div>

      {/* Bilgi */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold tracking-tight text-stone-900">€{listing.price}</span>
              <span className="text-[13px] text-stone-500">{t.perMonth}</span>
            </div>
            <span className="text-xs text-stone-500">{listing.expenses}</span>
          </div>

          {insight.status !== 'unknown' && (
            <span
              className={`max-w-[120px] text-center px-2 py-1 rounded-lg border text-[11px] font-bold leading-tight ${
                isPricey ? 'bg-orange-50 border-orange-300 text-orange-800' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}
            >
              {listing.fairPriceText}
            </span>
          )}
        </div>

        <div className="space-y-1">
          <h3
            id={`listing-title-${listing.id}`}
            onClick={handleOpenDetail}
            className="font-bold text-base text-stone-900 hover:text-orange-700 cursor-pointer transition-colors leading-snug line-clamp-2"
            title={t.goToDetailPage}
          >
            {listing.title}
          </h3>
          <div className="flex items-center gap-1.5 text-[13px] text-stone-600">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              {listing.streetAddress} · {listing.district.split('/')[0].trim()}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <span className={chipCls}>{listing.roomType}</span>
          <span className={chipCls}>{listingAreaM2(rawListing)} m²</span>
          <span className={chipCls}>
            {formatBathrooms(listing.bathrooms, currentLang)}
          </span>
        </div>

        <div className="border-t border-stone-100 pt-3 mt-auto space-y-1.5 text-[13px] text-stone-600">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-3.5 h-3.5 shrink-0 text-stone-500" />
            <span className="truncate">{listing.distanceToFaculty}</span>
          </div>
          {matesLine && (
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 shrink-0 text-stone-500" />
              <span className="truncate">{matesLine}</span>
            </div>
          )}
          <div className="flex items-center justify-between gap-2 pt-1 text-xs text-stone-500">
            <span className="truncate">
              {listing.contractStartDate ? `${t.contractStartDateLabel}: ${listing.contractStartDate}` : listing.contractType}
            </span>
            {isVerified && (
              <span className="flex items-center gap-1 font-bold text-emerald-700 shrink-0">
                <ShieldCheck className="w-3.5 h-3.5" />
                {t.verifiedStudent}
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};
