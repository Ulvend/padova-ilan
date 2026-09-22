import React from 'react';
import { 
  Heart, 
  Video, 
  MessageSquare, 
  MapPin, 
  Eye, 
  ExternalLink, 
  ShieldCheck, 
  Check, 
  Sparkles,
  Camera,
  Scale,
  Users,
  FileText,
  DoorClosed,
  Bath,
  Clock,
  Calendar,
  Bike,
  Flame,
  Wind,
  Car
} from 'lucide-react';
import { HousingListing, Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { getLocalizedListing } from '../utils/listingTranslator';
import { FlatmateIcon } from './FlatmateIcon';

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
  onOpenChat,
  currentLang = 'tr',
  layoutMode = 'double',
}) => {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.tr;
  const listing = getLocalizedListing(rawListing, currentLang);
  const isDouble = layoutMode === 'double';

  const handleToggleFav = (e: React.MouseEvent) => {
    const fn = onToggleFavorite || onFavoriteToggle;
    if (fn) fn(e, listing.id);
  };

  const handleOpenDetail = () => {
    const fn = onOpenDetailPage || onSelectListing;
    if (fn) fn(listing);
  };

  const handleOpenVideo = () => {
    const fn = onOpenVideoModal || onOpenVideoTour;
    if (fn) fn(listing);
  };

  const handleChat = () => {
    if (onOpenChat) onOpenChat(listing.poster.username, listing.title, listing.id);
  };

  return (
    <article 
      id={`housing-card-${listing.id}`}
      className={`bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full overflow-hidden ${
        isDouble ? 'p-4 sm:p-5 space-y-4' : 'p-5 md:p-6 space-y-5'
      }`}
    >
      <div className="space-y-3.5 flex-1">
        {/* Top Header: Poster + Verified Status & Favorite */}
        <div className="flex items-center justify-between pb-2 border-b border-stone-100 gap-2">
          {/* Poster Info */}
          <div className="flex items-center gap-2.5 min-w-0">
            <img 
              src={listing.poster.avatar} 
              alt={listing.poster.name} 
              className="w-10 h-10 rounded-full object-cover shrink-0 border border-stone-200"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-sm text-stone-900 truncate">@{listing.poster.username}</span>
                {listing.poster.verifiedUniPD && (
                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                    <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                    <span>{t.verifiedStudent}</span>
                  </span>
                )}
              </div>
              <span className="text-[11px] text-stone-500 font-medium block truncate">
                {listing.poster.department}
              </span>
            </div>
          </div>

          {/* Favorite Button */}
          <button
            type="button"
            onClick={handleToggleFav}
            className="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full border border-stone-200 bg-stone-50 hover:bg-rose-50 active:scale-95 transition cursor-pointer"
            title={isFavorite ? t.unfavorite : t.favorite}
            aria-label="Favori"
          >
            <Heart className={`w-4 h-4 transition-colors ${isFavorite ? 'fill-rose-600 text-rose-600' : 'text-stone-400'}`} />
          </button>
        </div>

        {/* Clickable Image Preview with Clean Badges */}
        {listing.images && listing.images.length > 0 && (
          <div 
            onClick={() => onOpenPreviewModal(listing)}
            className={`relative rounded-xl bg-stone-100 overflow-hidden cursor-pointer group ${
              isDouble ? 'aspect-[16/10] sm:aspect-[16/9]' : 'aspect-[16/8] sm:aspect-[21/9]'
            }`}
            title={t.quickPreview}
          >
            <img 
              src={listing.images[0]} 
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            
            {/* Bottom Floating Info Pill */}
            <div className="absolute bottom-2.5 left-2.5 bg-stone-900/80 text-white text-[11px] font-medium px-2.5 py-1 rounded-lg backdrop-blur-sm flex items-center gap-2">
              <span className="flex items-center gap-1.5"><Camera className="w-3 h-3 text-stone-300" /> {listing.images.length} {t.photosCount}</span>
              {listing.hasVideoTour && (
                <span className="text-purple-300 font-semibold flex items-center gap-1">
                  • <Video className="w-3 h-3 text-purple-300" /> {t.verifiedVideoTourBadge}
                </span>
              )}
            </div>

            {/* Quick Preview Hover Pill */}
            <div className="absolute top-2.5 right-2.5 bg-white/90 text-stone-800 text-[10px] font-bold px-2 py-1 rounded-md shadow-xs flex items-center gap-1 opacity-90 group-hover:opacity-100 backdrop-blur-xs">
              <Eye className="w-3 h-3 text-stone-600" />
              <span>{t.quickPreview}</span>
            </div>
          </div>
        )}

        {/* Pricing & Fair Value Ribbon */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-stone-950 tracking-tight">€{listing.price}</span>
            <span className="text-xs text-stone-500 font-medium">/{t.perMonth} {listing.expenses}</span>
          </div>

          <div className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md ${
            listing.fairPriceStatus === 'lower'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : listing.fairPriceStatus === 'average'
              ? 'bg-amber-50 text-amber-800 border border-amber-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            <Scale className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span>{listing.fairPriceText}</span>
          </div>
        </div>

        {/* Title & Street Address */}
        <div>
          <h3 
            id={`listing-title-${listing.id}`}
            onClick={handleOpenDetail}
            className="font-bold text-base sm:text-lg text-stone-900 hover:text-orange-600 cursor-pointer transition-colors leading-snug mb-1 line-clamp-2"
            title={t.goToDetailPage}
          >
            {listing.title}
          </h3>

          <div className="flex items-center gap-1.5 text-xs text-stone-600 font-medium flex-wrap">
            <span className="inline-flex items-center gap-1 text-stone-800 font-semibold">
              <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0" />
              <span>{listing.streetAddress}</span>
            </span>
            <span className="text-stone-300">•</span>
            <span className="text-stone-500">{listing.district}</span>
          </div>
        </div>

        {/* Short Description */}
        <p className="text-xs text-stone-600 leading-relaxed line-clamp-2">
          {listing.description}
        </p>

        {/* Roommates & Compatibility (Simplified, Uncluttered) */}
        <div className="bg-stone-50/80 border border-stone-150 p-2.5 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs pb-1 border-b border-stone-150/60">
            <span className="font-semibold text-stone-700 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-stone-500" />
              <span>
                {listing.totalHousemates ? `${listing.totalHousemates} ${t.totalOccupants.toLowerCase()}` : `${t.currentRoommates} (${listing.currentFlatmates?.length || 0})`}
              </span>
            </span>
            <div className="flex items-center gap-1.5">
              {listing.genderPreference && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  listing.genderPreference === 'female_only'
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : listing.genderPreference === 'male_only'
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-stone-100 text-stone-700 border border-stone-200'
                }`}>
                  {listing.genderPreference === 'female_only' ? t.genderFemaleOnly : listing.genderPreference === 'male_only' ? t.genderMaleOnly : t.genderAny}
                </span>
              )}
              {listing.compatibilityScore > 0 && (
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                  listing.compatibilityScore >= 90 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  %{listing.compatibilityScore} {t.compatibilityText}
                </span>
              )}
            </div>
          </div>

          {/* Gender distribution & Occupant Profile info pill */}
          {(listing.genderDistribution || listing.occupantType) && (
            <div className="flex items-center gap-1.5 text-[11px] text-stone-600 bg-white px-2 py-1 rounded-lg border border-stone-150 flex-wrap">
              {listing.genderDistribution && (
                <span className="font-medium text-stone-800">
                  👥 {listing.genderDistribution}
                </span>
              )}
              {listing.occupantType && (
                <>
                  <span className="text-stone-300">•</span>
                  <span className="text-stone-600">
                    {listing.occupantType === 'students_only' ? t.occupantsStudentsOnly : listing.occupantType === 'workers_only' ? t.occupantsWorkersOnly : t.occupantsMixed}
                  </span>
                </>
              )}
              {listing.smokingAllowed !== undefined && (
                <>
                  <span className="text-stone-300">•</span>
                  <span className={listing.smokingAllowed ? 'text-amber-700 font-medium' : 'text-stone-500'}>
                    {listing.smokingAllowed ? t.smokingAllowed : t.smokingForbidden}
                  </span>
                </>
              )}
            </div>
          )}

          {listing.currentFlatmates && listing.currentFlatmates.length > 0 && (
            <div className={`grid gap-1.5 ${isDouble ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
              {listing.currentFlatmates.slice(0, isDouble ? 2 : 4).map((flatmate, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-white border border-stone-150 px-2 py-1.5 rounded-lg text-xs">
                  <div className="w-6 h-6 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center shrink-0">
                    <FlatmateIcon iconName={flatmate.icon || flatmate.faculty} className="w-3.5 h-3.5 text-orange-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-stone-900 block text-[11px] truncate">
                      {flatmate.name} ({flatmate.age})
                    </span>
                    <span className="text-[10px] text-stone-500 block truncate">
                      {flatmate.faculty} • {flatmate.traits}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Feature Badges with Clean Minimalist Styling */}
        <div className="flex flex-wrap gap-1.5 text-xs">
          {listing.contractStartDate && (
            <span className="bg-orange-50 text-orange-900 border border-orange-200/80 px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 shadow-2xs">
              <Calendar className="w-3 h-3 text-orange-600 shrink-0" />
              <span>{t.contractStartDateLabel}: {listing.contractStartDate}</span>
            </span>
          )}

          {/* Padova Posto Bici (Bisiklet Park Yeri) */}
          {listing.hasBikeParking && (
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-300/80 px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 shadow-2xs" title={listing.bikeParkingDetails || t.bikeParkingBadge}>
              <Bike className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>Posto Bici (Padova)</span>
            </span>
          )}

          {/* Otopark / Garaj */}
          {listing.hasParking && (
            <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-1 rounded-md font-medium flex items-center gap-1" title={listing.parkingDetails || t.parkingBadge}>
              <Car className="w-3 h-3 text-blue-600 shrink-0" />
              <span>{t.parkingLabel}</span>
            </span>
          )}

          {/* Isıtma Tipi */}
          {listing.heatingType && (
            <span className="bg-rose-50 text-rose-800 border border-rose-200 px-2.5 py-1 rounded-md font-medium flex items-center gap-1">
              <Flame className="w-3 h-3 text-rose-600 shrink-0" />
              <span>{listing.heatingType === 'autonomo' ? 'Otonom Kombi' : 'Merkezi Isıtma'}</span>
            </span>
          )}

          {/* Klima */}
          {listing.hasAirConditioning && (
            <span className="bg-sky-50 text-sky-800 border border-sky-200 px-2 py-1 rounded-md font-medium flex items-center gap-1" title="Klima (A/C) Mevcut">
              <Wind className="w-3 h-3 text-sky-600 shrink-0" />
              <span>Klima</span>
            </span>
          )}

          {/* Çamaşır Makinesi */}
          {listing.hasWashingMachine && (
            <span className="bg-stone-100 text-stone-700 px-2 py-1 rounded-md font-medium flex items-center gap-1">
              <span>🧺</span>
              <span>Çamaşır Mak.</span>
            </span>
          )}

          <span className="bg-stone-100 text-stone-700 px-2.5 py-1 rounded-md font-medium flex items-center gap-1">
            <MapPin className="w-3 h-3 text-orange-600" />
            <span>{listing.distanceToFaculty}</span>
          </span>
          <span className="bg-stone-100 text-stone-700 px-2.5 py-1 rounded-md font-medium flex items-center gap-1">
            <FileText className="w-3 h-3 text-stone-500" />
            <span>{listing.contractType}</span>
          </span>
          <span className="bg-stone-100 text-stone-700 px-2.5 py-1 rounded-md font-medium flex items-center gap-1">
            <DoorClosed className="w-3 h-3 text-stone-500" />
            <span>{listing.roomType}</span>
          </span>
          <span className="bg-stone-100 text-stone-700 px-2.5 py-1 rounded-md font-medium flex items-center gap-1">
            <Bath className="w-3 h-3 text-stone-500" />
            <span>{listing.bathrooms} {t.bathroomsNumber}</span>
          </span>
          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200/60 px-2.5 py-1 rounded-md font-medium flex items-center gap-1">
            <Clock className="w-3 h-3 text-emerald-600" />
            <span>{listing.confirmationTimeLeft}</span>
          </span>
        </div>
      </div>

      {/* Card Footer: Clean Action Row */}
      <div className="border-t border-stone-100 pt-3 mt-3 space-y-2">
        <div className="text-stone-400 text-xs font-medium">
          {t.netRoomArea}: {listing.roomM2} m² • {t.totalAptArea}: {listing.apartmentM2} m²
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-12 gap-2 pt-0.5">
          {/* Quick Preview Button */}
          <button 
            id={`btn-card-preview-${listing.id}`}
            onClick={() => onOpenPreviewModal(listing)}
            className="col-span-3 min-h-[42px] border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 font-semibold text-xs rounded-xl cursor-pointer transition flex items-center justify-center gap-1"
            title={t.quickPreview}
          >
            <Eye className="w-4 h-4 text-stone-500 shrink-0" />
            <span className="hidden sm:inline">{t.quickPreview}</span>
          </button>

          {/* Primary CTA: İlan Sayfası */}
          <button 
            id={`btn-card-detail-${listing.id}`}
            onClick={handleOpenDetail}
            className="col-span-6 min-h-[42px] bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs sm:text-sm rounded-xl cursor-pointer transition flex items-center justify-center gap-1.5 shadow-xs active:scale-[0.98]"
            title={t.goToDetailPage}
          >
            <span>{t.viewListing}</span>
            <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-70" />
          </button>

          {/* Message CTA */}
          <button 
            onClick={handleChat}
            className="col-span-3 min-h-[42px] bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold uppercase cursor-pointer flex items-center justify-center gap-1 shadow-xs transition active:scale-[0.98]"
            title={t.sendMessage}
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">{t.messageBtn}</span>
          </button>
        </div>

        {/* Video Tour Quick Action */}
        {listing.hasVideoTour && (
          <button 
            onClick={handleOpenVideo}
            className="w-full min-h-[38px] border border-purple-200 bg-purple-50 hover:bg-purple-100/70 text-purple-900 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition mt-1"
          >
            <Video className="w-4 h-4 text-purple-700" />
            <span>{t.watchVideoTour}</span>
          </button>
        )}
      </div>
    </article>
  );
};
