import React, { useState } from 'react';
import { 
  X, 
  Heart, 
  Share2, 
  ShieldCheck, 
  MapPin, 
  Video, 
  MessageSquare, 
  Check, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Eye,
  Building2,
  Users,
  Scale,
  Calendar,
  Bike,
  Flame,
  Wind,
  Wifi,
  Car
} from 'lucide-react';
import { HousingListing, Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { getLocalizedListing } from '../utils/listingTranslator';

interface ListingPreviewModalProps {
  listing: HousingListing | null;
  isOpen?: boolean;
  onClose: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: (listingId: string) => void;
  onOpenDetailPage?: (listing: HousingListing) => void;
  onOpenDirectDetailPage?: (listing: HousingListing) => void;
  onOpenVideoTour?: (listing: HousingListing) => void;
  onOpenVideoModal?: (listing: HousingListing) => void;
  onOpenChat?: (user: string, subject: string) => void;
  currentLang?: Language;
}

export const ListingDetailModal: React.FC<ListingPreviewModalProps> = ({
  listing: rawListing,
  isOpen,
  onClose,
  isFavorite = false,
  onToggleFavorite,
  onOpenDetailPage,
  onOpenDirectDetailPage,
  onOpenVideoTour,
  onOpenVideoModal,
  onOpenChat,
  currentLang = 'tr',
}) => {
  if (!rawListing) return null;

  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.tr;
  const listing = getLocalizedListing(rawListing, currentLang);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGoToDetailPage = () => {
    onClose();
    const fn = onOpenDetailPage || onOpenDirectDetailPage;
    if (fn) fn(listing);
  };

  const nextImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIdx((prev) => (prev + 1) % listing.images.length);
  };

  const prevImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIdx((prev) => (prev - 1 + listing.images.length) % listing.images.length);
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
      onClick={onClose}
    >
      <div 
        id="listing-preview-popup"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white rounded-3xl border border-stone-200 overflow-hidden my-auto max-h-[92vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95"
      >
        {/* Modal Top Bar */}
        <div className="bg-stone-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-stone-800 shrink-0">
          <div className="flex items-center gap-2 text-xs truncate">
            <span className="bg-orange-600 px-2.5 py-0.5 font-bold uppercase tracking-wider text-[10px] text-white rounded-full">
              {t.quickPreview}
            </span>
            <span className="bg-stone-800 text-stone-200 text-[10px] px-2 py-0.5 rounded-md border border-stone-700 font-medium">
              {listing.roomType}
            </span>
            <span className="text-stone-500 hidden sm:inline">•</span>
            <span className="text-stone-300 truncate hidden sm:inline">{listing.district}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleShare}
              className="p-2 hover:bg-stone-800 text-stone-300 hover:text-white transition rounded-lg cursor-pointer"
              title={copied ? 'Kopyalandı' : 'Paylaş'}
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(listing.id);
              }}
              className="p-2 hover:bg-stone-800 text-stone-300 hover:text-white transition rounded-lg cursor-pointer"
              title="Favori"
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-stone-300'}`} />
            </button>

            <button
              id="btn-close-preview-popup"
              onClick={onClose}
              className="p-2 bg-stone-800 hover:bg-stone-700 text-white transition rounded-lg ml-1 font-bold cursor-pointer"
              title={t.closePreview}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-5 flex-1">
          
          {/* Header Title & Price Overview */}
          <div className="border-b border-stone-100 pb-4 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${
                listing.fairPriceStatus === 'lower' 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}>
                <Scale className="w-3.5 h-3.5" />
                <span>{listing.fairPriceText}</span>
              </span>

              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-bold text-stone-900">€{listing.price}</span>
                <span className="text-xs text-stone-500 font-medium">/ {t.perMonth} ({listing.expenses})</span>
              </div>
            </div>

            <h3 
              onClick={handleGoToDetailPage}
              className="text-lg sm:text-xl font-bold text-stone-900 leading-snug cursor-pointer hover:text-orange-600 transition"
              title={t.goToDetailPage}
            >
              {listing.title}
            </h3>

            <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
              <span className="flex items-center gap-1 font-semibold text-stone-800">
                <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                {listing.streetAddress}
              </span>
              <span>•</span>
              <span className="text-orange-700 font-medium">{listing.distanceToFaculty}</span>
              <span>•</span>
              <span className="text-emerald-700 font-medium">{listing.confirmationTimeLeft}</span>
            </div>
          </div>

          {/* Quick Photo Preview Carousel */}
          <div className="space-y-2">
            <div className="relative aspect-[16/9] sm:aspect-[21/9] bg-stone-900 rounded-2xl overflow-hidden flex items-center justify-center group">
              <img 
                src={listing.images[activeImageIdx]} 
                alt="" 
                className="w-full h-full object-cover"
              />

              {listing.images.length > 1 && (
                <>
                  <button
                    onClick={prevImg}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-stone-900/80 hover:bg-stone-900 text-white w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition shadow-md"
                    title={t.prevPhoto}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={nextImg}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-stone-900/80 hover:bg-stone-900 text-white w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition shadow-md"
                    title={t.nextPhoto}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}

              {listing.hasVideoTour && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenVideoTour(listing);
                  }}
                  className="absolute bottom-3 left-3 bg-stone-900/90 text-white px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 rounded-xl hover:bg-orange-600 transition cursor-pointer shadow-md"
                >
                  <Video className="w-3.5 h-3.5 text-orange-400" />
                  <span>{t.videoTour360}</span>
                </button>
              )}

              <span className="absolute top-3 right-3 bg-stone-900/80 text-white text-[10px] px-2.5 py-1 rounded-full font-medium shadow-sm">
                {activeImageIdx + 1} / {listing.images.length}
              </span>
            </div>

            {/* Thumbnail dots/strip */}
            {listing.images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {listing.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIdx(idx)}
                    className={`w-14 h-10 rounded-lg shrink-0 overflow-hidden cursor-pointer transition border ${
                      activeImageIdx === idx ? 'border-orange-600 ring-2 ring-orange-400/30' : 'border-stone-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Specs Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
              <span className="text-stone-400 block text-[10px] uppercase font-medium">{t.roomTypeLabel}</span>
              <strong className="text-stone-900">{listing.roomType}</strong>
            </div>
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
              <span className="text-stone-400 block text-[10px] uppercase font-medium">{t.roomArea}</span>
              <strong className="text-stone-900">{listing.roomM2} m²</strong>
            </div>
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
              <span className="text-stone-400 block text-[10px] uppercase font-medium">{t.bathroomsCount}</span>
              <strong className="text-stone-900">{listing.bathrooms}</strong>
            </div>
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
              <span className="text-stone-400 block text-[10px] uppercase font-medium">{t.compatibilityScore}</span>
              <strong className="text-emerald-700 font-bold">%{listing.compatibilityScore} {t.compatible}</strong>
            </div>
          </div>

          {/* Contract Start Date & Duration Highlight */}
          <div className="p-3 bg-orange-50/70 rounded-xl border border-orange-200/80 flex items-center justify-between text-xs">
            <span className="text-orange-950 text-[11px] uppercase font-bold flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-orange-600 shrink-0" />
              <span>{t.contractStartDateLabel}</span>
            </span>
            <strong className="text-orange-950 font-bold text-xs bg-white px-2.5 py-1 rounded-lg border border-orange-200/80 shadow-2xs">
              {listing.contractStartDate || t.contractStartImmediate} {listing.contractDuration ? `• ${listing.contractDuration}` : ''}
            </strong>
          </div>

          {/* Roommate Profile & Critical Amenities Badges */}
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-stone-700 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-stone-500" />
                <span>{listing.totalHousemates || 3} Kişilik Ev • {listing.genderDistribution || 'Karma'}</span>
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                listing.genderPreference === 'female_only'
                  ? 'bg-rose-100 text-rose-800'
                  : listing.genderPreference === 'male_only'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-stone-200 text-stone-700'
              }`}>
                {listing.genderPreference === 'female_only' ? t.genderFemaleOnly : listing.genderPreference === 'male_only' ? t.genderMaleOnly : t.genderAny}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1 border-t border-stone-200/60">
              {listing.hasBikeParking && (
                <span className="bg-emerald-50 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-md font-semibold text-[11px] flex items-center gap-1">
                  <Bike className="w-3 h-3 text-emerald-700" />
                  <span>Posto Bici (Padova)</span>
                </span>
              )}
              {listing.hasParking && (
                <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-md font-medium text-[11px] flex items-center gap-1">
                  <Car className="w-3 h-3 text-blue-600" />
                  <span>{t.parkingLabel}</span>
                </span>
              )}
              {listing.heatingType && (
                <span className="bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-md font-medium text-[11px] flex items-center gap-1">
                  <Flame className="w-3 h-3 text-rose-600" />
                  <span>{listing.heatingType === 'autonomo' ? 'Otonom Kombi' : 'Merkezi Isıtma'}</span>
                </span>
              )}
              {listing.hasAirConditioning && (
                <span className="bg-sky-50 text-sky-800 border border-sky-200 px-2 py-0.5 rounded-md font-medium text-[11px] flex items-center gap-1">
                  <Wind className="w-3 h-3 text-sky-600" />
                  <span>Klima</span>
                </span>
              )}
              {listing.hasWashingMachine && (
                <span className="bg-white border border-stone-200 text-stone-700 px-2 py-0.5 rounded-md font-medium text-[11px] flex items-center gap-1">
                  <span>🧺 Çamaşır Mak.</span>
                </span>
              )}
              {listing.hasWifi !== false && (
                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md font-medium text-[11px] flex items-center gap-1">
                  <Wifi className="w-3 h-3 text-emerald-600" />
                  <span>Wi-Fi</span>
                </span>
              )}
            </div>
          </div>

          {/* Short Description Summary */}
          <div className="border border-stone-200 p-4 rounded-2xl bg-white space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 block">{t.shortDescription}</span>
            <p className="text-xs text-stone-600 leading-relaxed line-clamp-3">
              {listing.description}
            </p>
          </div>

          {/* Poster Mini Summary */}
          <div className="p-3 border border-stone-200 rounded-2xl bg-stone-50/70 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <img 
                src={listing.poster.avatar} 
                alt="" 
                className="w-10 h-10 rounded-full border border-stone-200 object-cover shadow-xs" 
              />
              <div>
                <strong className="block text-stone-900 font-semibold">{listing.poster.name}</strong>
                <span className="text-[10px] text-stone-500 block">
                  @{listing.poster.username} • {listing.poster.department}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                onOpenChat(listing.poster.username, listing.title);
              }}
              className="border border-stone-200 bg-white hover:bg-stone-50 px-3 py-2 font-semibold text-stone-700 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer active:translate-y-0.5"
            >
              <MessageSquare className="w-3.5 h-3.5 text-stone-500" />
              <span>{t.sendMessage}</span>
            </button>
          </div>

        </div>

        {/* Modal Footer with Primary Link to Dedicated Full Listing Page */}
        <div className="bg-stone-50 px-5 py-3.5 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button 
            id="btn-preview-close"
            onClick={onClose}
            className="border border-stone-200 px-4 py-2.5 bg-white hover:bg-stone-100 font-semibold text-xs text-stone-700 rounded-xl cursor-pointer transition shadow-xs"
          >
            {t.closePreview}
          </button>

          {/* Dedicated Page Button */}
          <button
            id="btn-preview-goto-detail-page"
            onClick={handleGoToDetailPage}
            className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2.5 px-5 text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-sm active:translate-y-0.5 transition"
          >
            <span>{t.goToDetailPage}</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
