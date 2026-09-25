import { useModalBehavior } from '../utils/useModalBehavior';
import React, { useEffect, useState } from 'react';
import { X, Heart, Share2, MapPin, Video, Check, ChevronLeft, ChevronRight, Camera } from 'lucide-react';
import { HousingListing, Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { HOME_TEXT } from '../utils/homeText';
import { getLocalizedListing } from '../utils/listingTranslator';
import { useApp } from '../context/AppContext';
import { formatGenderDistribution } from '../utils/genderDistribution';
import { listingAreaM2 } from '../utils/format';
import { ExtraCosts } from './ExtraCosts';

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
  onOpenChat?: (user: string, subject: string, listingId?: string) => void;
  currentLang?: Language;
}

// Hook'lar koşulsuz çağrılsın diye içerik yalnızca ilan varken mount edilir.
const ListingDetailModalContent: React.FC<Omit<ListingPreviewModalProps, 'listing'> & { listing: HousingListing }> = ({
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
  currentLang = 'it',
}) => {

  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.it;
  const h = HOME_TEXT[currentLang] || HOME_TEXT.it;
  const { getPriceInsight } = useApp();
  const insight = getPriceInsight(rawListing);
  const listing = getLocalizedListing(rawListing, currentLang, insight);
  // Escape bu bileşenin kendi klavye işleyicisinde ele alınır; burada yalnızca kaydırma kilidi.
  useModalBehavior(Boolean(isOpen ?? true), onClose, false);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const imageCount = listing.images?.length || 0;

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

  const step = (dir: 1 | -1) => {
    if (imageCount < 2) return;
    setActiveImageIdx((prev) => (prev + dir + imageCount) % imageCount);
  };

  // Klavye: Esc kapatır, ← → fotoğraf değiştirir.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const isPricey = listing.fairPriceStatus !== 'lower' && listing.fairPriceStatus !== 'average';
  const hasGender = Boolean(listing.femaleCount || listing.maleCount);
  const tile = 'px-4 py-3.5 bg-stone-50 border border-stone-100 rounded-[14px] space-y-1';
  const tileLabel = 'block text-xs font-bold uppercase tracking-wider text-stone-500';
  const amenities = [
    listing.heatingType ? (listing.heatingType === 'autonomo' ? t.heatingAutonomo : t.heatingCentralizzato) : '',
    listing.hasAirConditioning ? t.airConditioningLabel : '',
    listing.hasWashingMachine ? t.washerShort : '',
    listing.hasWifi !== false ? 'Wi-Fi' : '',
    listing.hasBikeParking ? t.bikeSpotShort : '',
    listing.hasParking ? t.parkingLabel : '',
  ].filter(Boolean);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        id="listing-preview-popup"
        role="dialog"
        aria-modal="true"
        aria-label={h.previewTitle}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-6xl bg-white rounded-[28px] overflow-hidden my-auto max-h-[94vh] flex flex-col lg:flex-row shadow-2xl"
      >
        {/* Galeri */}
        <div className="lg:w-[55%] shrink-0 flex flex-col bg-stone-100">
          <div className="relative flex-1 min-h-[240px] sm:min-h-[340px] lg:min-h-[520px] bg-stone-200">
            {imageCount > 0 ? (
              <img src={listing.images[activeImageIdx]} alt={listing.title} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-stone-400">
                <Camera className="w-12 h-12" />
              </div>
            )}

            <div className="absolute left-4 top-4 flex p-1 bg-white rounded-2xl shadow-md">
              <span className="h-9 px-4 bg-stone-900 text-white rounded-xl text-sm font-bold flex items-center">
                {h.photosTab} · {imageCount}
              </span>
              {listing.hasVideoTour && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    (onOpenVideoTour || onOpenVideoModal)?.(listing);
                  }}
                  className="h-9 px-4 rounded-xl text-sm font-bold text-stone-900 flex items-center gap-1.5 cursor-pointer hover:bg-stone-100 transition"
                >
                  <Video className="w-[15px] h-[15px]" />
                  {h.videoTab}
                </button>
              )}
            </div>

            {imageCount > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    step(-1);
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white text-stone-900 rounded-full flex items-center justify-center shadow-md cursor-pointer hover:bg-stone-50 transition"
                  aria-label={t.prevPhoto}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    step(1);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white text-stone-900 rounded-full flex items-center justify-center shadow-md cursor-pointer hover:bg-stone-50 transition"
                  aria-label={t.nextPhoto}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <span className="absolute right-5 bottom-4 h-[30px] px-3 bg-stone-900/70 text-white text-[13px] font-semibold rounded-full flex items-center">
                  {activeImageIdx + 1} / {imageCount}
                </span>
              </>
            )}
          </div>

          {imageCount > 1 && (
            <div className="bg-white border-t border-stone-200 px-5 py-4 flex gap-2.5 overflow-x-auto no-scrollbar">
              {listing.images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIdx(idx)}
                  aria-label={`${idx + 1} / ${imageCount}`}
                  aria-current={activeImageIdx === idx}
                  className={`w-20 h-[68px] shrink-0 rounded-xl overflow-hidden cursor-pointer transition border-[3px] ${
                    activeImageIdx === idx ? 'border-orange-600' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Bilgi */}
        <div className="flex-1 min-w-0 flex flex-col overflow-y-auto">
          <button
            id="btn-close-preview-popup"
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 w-11 h-11 rounded-full flex items-center justify-center text-stone-900 hover:bg-stone-100 transition cursor-pointer z-10 bg-white/80 lg:bg-transparent"
            title={t.closePreview}
            aria-label={t.closePreview}
          >
            <X className="w-[22px] h-[22px]" />
          </button>

          <div className="p-6 sm:p-8 lg:pt-7 space-y-[18px] flex-1">
            <div className="text-xs font-bold uppercase tracking-widest text-stone-500">{h.previewTitle}</div>

            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-4xl sm:text-[40px] font-extrabold tracking-tight text-stone-900">€{listing.price}</span>
              <span className="text-[15px] text-stone-500">
                {t.perMonth} · {listing.expenses}
              </span>
            </div>
            <ExtraCosts listing={listing} t={t} />

            {insight.status !== 'unknown' && (
              <span
                className={`inline-block px-3 py-1.5 rounded-[10px] border text-[13px] font-bold ${
                  isPricey ? 'bg-orange-50 border-orange-300 text-orange-800' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                }`}
              >
                {listing.fairPriceText}
              </span>
            )}

            <div className="space-y-1.5">
              <h3
                onClick={handleGoToDetailPage}
                className="font-display font-bold text-[28px] sm:text-3xl leading-tight text-stone-900 cursor-pointer hover:text-orange-700 transition"
                title={t.goToDetailPage}
              >
                {listing.title}
              </h3>
              <div className="flex items-center gap-1.5 text-[15px] text-stone-600">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>
                  {listing.streetAddress}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className={tile}>
                <span className={tileLabel}>{t.roomTypeLabel}</span>
                <strong className="text-[15px] text-stone-900">
                  {listing.roomType} · {listingAreaM2(rawListing)} m²
                </strong>
              </div>
              <div className={tile}>
                <span className={tileLabel}>{t.contractStartDateLabel}</span>
                <strong className="text-[15px] text-stone-900">
                  {listing.contractStartDate}
                  {listing.contractEndDate ? ` – ${listing.contractEndDate}` : ''}
                </strong>
              </div>
              <div className={tile}>
                <span className={tileLabel}>{t.peopleUnit}</span>
                <strong className="text-[15px] text-stone-900">
                  {hasGender ? formatGenderDistribution(listing.femaleCount, listing.maleCount, t) : `${listing.totalHousemates || '-'} ${t.peopleUnit}`}
                </strong>
              </div>
              <div className={tile}>
                <span className={tileLabel}>{t.areaProximityLabel}</span>
                <strong className="text-[15px] text-stone-900">{listing.distanceToFaculty}</strong>
              </div>
            </div>

            {amenities.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {amenities.map((a) => (
                  <span key={a} className="px-3 py-1.5 bg-stone-100 rounded-[10px] text-[13px] font-semibold text-stone-700">
                    {a}
                  </span>
                ))}
              </div>
            )}

            {listing.description && <p className="text-sm text-stone-600 leading-relaxed line-clamp-3">{listing.description}</p>}
          </div>

          <div className="p-6 sm:p-8 pt-0 space-y-3">
            <div className="flex gap-2.5">
              <button
                id="btn-preview-goto-detail-page"
                type="button"
                onClick={handleGoToDetailPage}
                className="flex-1 h-[52px] bg-orange-600 hover:bg-orange-700 text-white rounded-[14px] text-base font-bold cursor-pointer transition active:scale-[0.98]"
              >
                {h.seeFullListing}
              </button>
              <button
                type="button"
                onClick={() => onToggleFavorite?.(listing.id)}
                className="w-[52px] h-[52px] bg-white border border-stone-300 hover:border-stone-500 rounded-[14px] flex items-center justify-center cursor-pointer transition"
                title={isFavorite ? t.unfavorite : t.favorite}
                aria-label={isFavorite ? t.unfavorite : t.favorite}
                aria-pressed={isFavorite}
              >
                <Heart className={`w-[22px] h-[22px] ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-stone-900'}`} />
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="w-[52px] h-[52px] bg-white border border-stone-300 hover:border-stone-500 rounded-[14px] flex items-center justify-center cursor-pointer transition"
                title={copied ? t.copied : t.share}
                aria-label={t.share}
              >
                {copied ? <Check className="w-[22px] h-[22px] text-emerald-600" /> : <Share2 className="w-[22px] h-[22px] text-stone-900" />}
              </button>
            </div>
            <button
              id="btn-preview-message"
              type="button"
              onClick={() => {
                onClose();
                onOpenChat?.(listing.poster.username, listing.title, listing.id);
              }}
              className="w-full h-12 bg-white border border-stone-300 hover:border-stone-500 rounded-[14px] text-[15px] font-bold text-stone-900 cursor-pointer transition"
            >
              {t.sendMessage}
            </button>
            <p className="hidden lg:block text-center text-xs text-stone-500">{h.keysHint}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ListingDetailModal: React.FC<ListingPreviewModalProps> = ({ listing, ...rest }) =>
  listing ? <ListingDetailModalContent {...rest} listing={listing} /> : null;
