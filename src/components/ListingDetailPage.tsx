import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Heart, 
  Share2, 
  MapPin, 
  CheckCircle2, 
  ShieldCheck, 
  Play, 
  Pause, 
  Maximize2, 
  MessageSquare, 
  Calendar, 
  Eye, 
  Building2, 
  Sparkles, 
  Check, 
  AlertTriangle,
  Flame,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Scale,
  Copy,
  Info,
  Camera,
  Video,
  FileText,
  VolumeX,
  Ban,
  Users,
  ClipboardList,
  Map,
  Bike,
  Wind,
  Wifi,
  Car,
  Cigarette,
  Dog,
  Pencil
} from 'lucide-react';
import { HousingListing, Language, UserProfile } from '../types';
import { DISTRICT_BENCHMARKS } from '../data/mockData';
import { TRANSLATIONS } from '../utils/translations';
import { getLocalizedListing } from '../utils/listingTranslator';
import { PadovaMap } from './PadovaMap';
import { FlatmateIcon } from './FlatmateIcon';

interface ListingDetailPageProps {
  listing: HousingListing;
  isFavorite: boolean;
  onToggleFavorite: (listingId: string) => void;
  onBackToHome: () => void;
  onOpenChat: (username: string, subject: string, listingId?: string) => void;
  onOpenVideoTourModal: (listing: HousingListing) => void;
  onEditListing?: (listing: HousingListing) => void;
  currentUser?: UserProfile;
  isLoggedIn?: boolean;
  currentLang: Language;
}

export const ListingDetailPage: React.FC<ListingDetailPageProps> = ({
  listing: rawListing,
  isFavorite,
  onToggleFavorite,
  onBackToHome,
  onOpenChat,
  onOpenVideoTourModal,
  onEditListing,
  currentUser,
  isLoggedIn = false,
  currentLang,
}) => {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.tr;
  const listing = getLocalizedListing(rawListing, currentLang);

  // Image & Video Gallery State
  const [activeMediaTab, setActiveMediaTab] = useState<'photos' | 'video'>('photos');
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isPhotoZoomed, setIsPhotoZoomed] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Embedded Video Tour State
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [videoCameraAngle, setVideoCameraAngle] = useState<'wide' | 'desk' | 'shared'>('wide');
  const [videoProgress, setVideoProgress] = useState(12);

  // Benchmarks & District Calculation
  const benchmark = DISTRICT_BENCHMARKS[listing.district] || {
    avgPriceSingola: 435,
    avgPriceDoppia: 310,
    canoneConcordatoRange: '€380 - €460',
    districtLabel: listing.district,
    marketTrend: 'Padova öğrenci bölgesinde dengeli talep',
  };

  const isDoppia = listing.roomType === 'Doppia' || listing.roomType === 'Posto Letto';
  const regionalAverage = isDoppia ? benchmark.avgPriceDoppia : benchmark.avgPriceSingola;
  const priceDifference = listing.price - regionalAverage;
  const percentageRatio = Math.round((Math.abs(priceDifference) / regionalAverage) * 100);

  // Video progress timer simulation
  useEffect(() => {
    let interval: any;
    if (isPlayingVideo) {
      interval = setInterval(() => {
        setVideoProgress((prev) => (prev >= 30 ? 0 : prev + 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlayingVideo]);

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const nextPhoto = () => {
    setActivePhotoIndex((prev) => (prev + 1) % listing.images.length);
  };

  const prevPhoto = () => {
    setActivePhotoIndex((prev) => (prev - 1 + listing.images.length) % listing.images.length);
  };

  // Sahiplik yalnızca Firebase UID ile belirlenir (kullanıcı adı çakışabilir).
  const isOwner = Boolean(
    currentUser?.id && (rawListing.userId === currentUser.id || rawListing.poster?.id === currentUser.id)
  );

  return (
    <div className="w-full space-y-6 pb-24 sm:pb-16">
      
      {/* 1. Top Breadcrumb & Actions Bar */}
      <div className="p-4 bg-white flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            id="btn-back-to-search"
            onClick={onBackToHome}
            className="border border-stone-200 bg-white hover:bg-stone-50 min-h-[42px] px-3.5 py-2 text-xs font-semibold flex items-center gap-2 rounded-xl shadow-xs transition cursor-pointer active:translate-y-0.5 text-stone-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.backToHome}</span>
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* İlanı Düzenle Button for Listing Owner */}
          {isOwner && (
            <button
              type="button"
              onClick={() => onEditListing?.(rawListing)}
              className="border border-amber-400 bg-amber-500 hover:bg-amber-600 text-white min-h-[42px] px-4 py-2 text-xs font-bold flex items-center gap-1.5 rounded-xl shadow-xs transition cursor-pointer active:translate-y-0.5"
              title="İlanı, fotoğrafları ve videoyu düzenle"
            >
              <Pencil className="w-4 h-4" />
              <span>{currentLang === 'tr' ? 'İlanı Düzenle' : currentLang === 'it' ? 'Modifica Annuncio' : 'Edit Listing'}</span>
            </button>
          )}

          {/* WhatsApp Direct Share */}
          <button
            type="button"
            onClick={() => {
              const text = `${listing.title} - Padova Öğrenci İlanı:\n${window.location.href}`;
              window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
            }}
            className="border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 min-h-[42px] px-3 py-2 text-xs font-semibold flex items-center gap-1.5 rounded-xl shadow-xs transition cursor-pointer active:translate-y-0.5"
            title="WhatsApp ile Paylaş"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">WhatsApp</span>
          </button>

          {/* Facebook Direct Share */}
          <button
            type="button"
            onClick={() => {
              window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank');
            }}
            className="border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-800 min-h-[42px] px-3 py-2 text-xs font-semibold flex items-center gap-1.5 rounded-xl shadow-xs transition cursor-pointer active:translate-y-0.5"
            title="Facebook Grubunda Paylaş"
          >
            <Share2 className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Facebook</span>
          </button>

          {/* Copy Link button */}
          <button
            onClick={handleShare}
            className="border border-stone-200 bg-white hover:bg-stone-50 min-h-[42px] px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5 rounded-xl shadow-xs transition cursor-pointer active:translate-y-0.5 text-stone-700"
            title={t.share}
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copiedLink ? t.copied : 'Linki Kopyala'}</span>
          </button>

          {/* Favorite button */}
          <button
            onClick={() => onToggleFavorite(listing.id)}
            className={`border min-h-[42px] px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5 rounded-xl shadow-xs transition cursor-pointer active:translate-y-0.5 ${
              isFavorite ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-700'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-600 text-rose-600' : 'text-stone-700'}`} />
          </button>
        </div>
      </div>

      {/* 2. Main Title, Address & Quick Info Banner */}
      <div className="p-5 md:p-6 bg-white rounded-2xl border border-stone-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-100 pb-5">
          <div className="space-y-2 flex-1 min-w-[280px]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-orange-600 text-white px-2.5 py-0.5 text-[10px] font-bold rounded-full">
                {listing.id}
              </span>
              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
                {listing.roomType}
              </span>
              {listing.hasVideoTour && (
                <span className="bg-purple-50 text-purple-800 border border-purple-200 text-[10px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Video className="w-3.5 h-3.5 text-purple-700" />
                  <span>{t.verifiedVideoTourBadge}</span>
                </span>
              )}
              {listing.isStudentCardVerified && (
                <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                  <span>{t.studentCardVerified}</span>
                </span>
              )}
              {listing.contractStartDate && (
                <span className="bg-orange-50 text-orange-950 border border-orange-200/80 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                  <Calendar className="w-3.5 h-3.5 text-orange-600" />
                  <span>{t.contractStartDateLabel}: {listing.contractStartDate}</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-stone-900 leading-snug">
              {listing.title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 pt-1">
              <span className="flex items-center gap-1 font-semibold text-stone-900">
                <MapPin className="w-3.5 h-3.5 text-orange-600" />
                {listing.streetAddress}
              </span>
              <span>•</span>
              <span className="text-orange-700 font-semibold">{listing.distanceToFaculty}</span>
              <span>•</span>
              <span className="text-stone-400">{t.photosCount}: {listing.images.length}</span>
              <span>•</span>
              <span className="text-emerald-700 font-semibold">{listing.confirmationTimeLeft}</span>
            </div>
          </div>

          {/* Price Box */}
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-right shrink-0">
            <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide block">{t.monthlyRent}</span>
            <div className="flex items-baseline justify-end gap-1.5">
              <span className="text-3xl md:text-4xl font-bold text-stone-900">€{listing.price}</span>
              <span className="text-xs text-stone-500 font-medium">/ {t.perMonth}</span>
            </div>
            <span className="text-[11px] text-stone-600 font-medium block mt-0.5">{listing.expenses}</span>
            <button
              onClick={() => onOpenChat(listing.poster.username, listing.title, listing.id)}
              className="w-full mt-3 py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition active:translate-y-0.5"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{t.chatWithOwner}</span>
            </button>
          </div>
        </div>

        {/* 3. DEDICATED REGIONAL AVERAGE PRICE RATIO & FAIR PRICE AUDIT (Bölge Ortalamasına Göre Oran) */}
        <div className="p-4 md:p-5 bg-gradient-to-r from-emerald-50/70 via-teal-50/50 to-amber-50/60 rounded-2xl border border-emerald-200/80 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200/60 pb-2.5">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-emerald-800" />
              <h2 className="text-sm md:text-base font-bold uppercase tracking-tight text-stone-900">
                {t.regionalPriceRatioTitle}
              </h2>
            </div>
            <span className="bg-emerald-800 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {t.padovaComuneAudit}
            </span>
          </div>

          {/* Big Ratio Badge and Key Comparison Figures */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            
            {/* Left Result Highlight (5 cols) */}
            <div className="md:col-span-5 bg-white border border-stone-200 rounded-xl p-3.5 shadow-xs">
              <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide block mb-1">
                {benchmark.districtLabel}
              </span>
              
              <div className="flex items-center gap-2.5">
                {priceDifference <= 0 ? (
                  <div className="bg-emerald-600 text-white p-2 rounded-xl">
                    <TrendingDown className="w-6 h-6" />
                  </div>
                ) : (
                  <div className="bg-rose-600 text-white p-2 rounded-xl">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                )}

                <div>
                  <div className="text-lg md:text-xl font-bold text-stone-900 leading-tight">
                    {priceDifference < 0 ? (
                      <span className="text-emerald-700">%{percentageRatio} {t.moreAffordable}</span>
                    ) : priceDifference === 0 ? (
                      <span className="text-amber-700">{t.exactAverage}</span>
                    ) : (
                      <span className="text-rose-700">%{percentageRatio} {t.aboveAverage}</span>
                    )}
                  </div>
                  <span className="text-[11px] text-stone-500 font-medium block">
                    {t.regionalAverage}: €{regionalAverage} ({priceDifference < 0 ? `-€${Math.abs(priceDifference)}` : `+€${priceDifference}`})
                  </span>
                </div>
              </div>
            </div>

            {/* Right Comparison Metrics Grid (7 cols) */}
            <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="bg-white border border-stone-200 rounded-xl p-2.5">
                <span className="text-[10px] text-stone-400 block uppercase font-medium">{t.rentOfThisRoom}</span>
                <span className="text-base font-bold text-stone-900">€{listing.price}</span>
                <span className="text-[9px] text-emerald-700 block font-semibold">{listing.contractType.split(' ')[0]}</span>
              </div>

              <div className="bg-white border border-stone-200 rounded-xl p-2.5">
                <span className="text-[10px] text-stone-400 block uppercase font-medium">{t.regionalAverage}</span>
                <span className="text-base font-bold text-stone-800">€{regionalAverage}</span>
                <span className="text-[9px] text-stone-500 block">{listing.roomType}</span>
              </div>

              <div className="bg-white border border-stone-200 rounded-xl p-2.5 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-stone-400 block uppercase font-medium">{t.canoneConcordatoLabel}</span>
                <span className="text-sm font-bold text-stone-800">{benchmark.canoneConcordatoRange}</span>
                <span className="text-[9px] text-emerald-800 block font-semibold">{t.padovaComuneAudit}</span>
              </div>
            </div>

          </div>

          {/* Visual Gauge Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[10px] font-semibold text-stone-500">
              <span>€350 ({t.economicLabel})</span>
              <span className="text-emerald-800 font-bold flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-800" />
                <span>{t.thisListingLabel}: €{listing.price}</span>
              </span>
              <span className="text-stone-700">{t.regionalAverage}: €{regionalAverage}</span>
              <span>€550+ ({t.expensiveLabel})</span>
            </div>

            <div className="h-2.5 w-full bg-stone-200 rounded-full relative overflow-hidden">
              {/* Scale zone */}
              <div className="absolute inset-y-0 left-0 w-2/5 bg-emerald-300"></div>
              <div className="absolute inset-y-0 left-2/5 w-1/3 bg-amber-200"></div>
              <div className="absolute inset-y-0 right-0 w-4/15 bg-rose-300"></div>

              {/* Marker for this listing */}
              <div 
                className="absolute top-0 bottom-0 w-2 bg-stone-900 -translate-x-1/2 rounded-full shadow-md"
                style={{ 
                  left: `${Math.min(95, Math.max(5, ((listing.price - 300) / 300) * 100))}%` 
                }}
                title={`${t.thisListingLabel}: €${listing.price}`}
              ></div>
            </div>

            <p className="text-[11px] text-stone-600 leading-snug pt-1">
              <strong>*{t.priceGuaranteeTitle}:</strong> {benchmark.marketTrend}. {t.priceGuaranteeBody}
            </p>
          </div>
        </div>

      </div>

      {/* 4. Unified Media Gallery (Photos & Interactive Video Tour) */}
      <div className="p-4 md:p-5 bg-white rounded-2xl border border-stone-200 shadow-sm space-y-4">
        {/* Gallery Header with Mode Tabs & Action Tools */}
        <div className="flex flex-wrap items-center justify-between border-b border-stone-100 pb-3 gap-3">
          <div className="flex items-center gap-2">
            {/* Photos Tab */}
            <button
              onClick={() => {
                setActiveMediaTab('photos');
                setIsPlayingVideo(false);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeMediaTab === 'photos'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{t.photosCount} ({listing.images.length})</span>
            </button>

            {/* Video Tour Tab */}
            {listing.hasVideoTour && (
              <button
                onClick={() => setActiveMediaTab('video')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  activeMediaTab === 'video'
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>{t.verifiedVideoTourBadge}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeMediaTab === 'photos' ? (
              <>
                <span className="text-xs text-stone-400 font-semibold">
                  {activePhotoIndex + 1} / {listing.images.length}
                </span>
                <button
                  onClick={() => setIsPhotoZoomed(true)}
                  className="border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 px-3 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t.openModal360}</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => onOpenVideoTourModal(listing)}
                className="border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-900 px-3.5 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer transition"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>{t.openModal360}</span>
              </button>
            )}
          </div>
        </div>

        {/* Media Player Screen: Either Hero Photo or Interactive Video */}
        {activeMediaTab === 'photos' ? (
          /* Hero Photo Display */
          <div className="relative aspect-video sm:aspect-[16/9] md:aspect-[21/9] bg-stone-950 rounded-2xl overflow-hidden group">
            <img 
              src={listing.images[activePhotoIndex]} 
              alt={`Foto ${activePhotoIndex + 1}`} 
              className="w-full h-full object-cover transition-transform duration-300"
            />

            {/* Navigation Arrows (Touch friendly) */}
            <button
              onClick={prevPhoto}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-stone-900/80 hover:bg-stone-900 text-white w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center cursor-pointer transition active:scale-95 shadow-lg"
              title={t.prevPhoto}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={nextPhoto}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-stone-900/80 hover:bg-stone-900 text-white w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center cursor-pointer transition active:scale-95 shadow-lg"
              title={t.nextPhoto}
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={() => setIsPhotoZoomed(true)}
              className="absolute top-3 right-3 bg-stone-900/80 hover:bg-stone-900 text-white px-3 py-2 text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md min-h-[40px]"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {/* Overlay Tag */}
            <div className="absolute bottom-3 left-3 bg-stone-900/80 text-white px-3 py-1 text-xs rounded-lg">
              {listing.title} • #{activePhotoIndex + 1}
            </div>
          </div>
        ) : (
          /* Embedded Video Walkthrough Player */
          <div className="rounded-2xl bg-stone-950 text-white overflow-hidden shadow-sm border border-stone-800">
            {/* Top Video Header */}
            <div className="p-3 bg-stone-900 border-b border-stone-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                <span className="font-medium text-stone-300">
                  UniPD • {listing.distanceToFaculty}
                </span>
              </div>
              
              {/* Camera Angle Switcher */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setVideoCameraAngle('wide')}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition ${
                    videoCameraAngle === 'wide' 
                      ? 'bg-orange-600 text-white' 
                      : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                  }`}
                >
                  {t.videoAngleWide}
                </button>
                <button
                  onClick={() => setVideoCameraAngle('desk')}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition ${
                    videoCameraAngle === 'desk' 
                      ? 'bg-orange-600 text-white' 
                      : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                  }`}
                >
                  {t.videoAngleDesk}
                </button>
                <button
                  onClick={() => setVideoCameraAngle('shared')}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition ${
                    videoCameraAngle === 'shared' 
                      ? 'bg-orange-600 text-white' 
                      : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                  }`}
                >
                  {t.videoAngleShared}
                </button>
              </div>
            </div>

            {/* Video Simulated Stage */}
            <div className="relative aspect-video sm:aspect-[21/9] bg-black flex items-center justify-center overflow-hidden">
              <img
                src={
                  videoCameraAngle === 'wide'
                    ? listing.images[0]
                    : videoCameraAngle === 'desk'
                    ? listing.images[1] || listing.images[0]
                    : listing.images[2] || listing.images[0]
                }
                alt="Video Tour Frame"
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  isPlayingVideo ? 'opacity-90 scale-105 transition-transform duration-1000' : 'opacity-70'
                }`}
              />

              {/* Play overlay button if paused */}
              {!isPlayingVideo && (
                <button
                  onClick={() => setIsPlayingVideo(true)}
                  className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center shadow-xl cursor-pointer transition transform hover:scale-110"
                >
                  <Play className="w-8 h-8 fill-current ml-1" />
                </button>
              )}

              {/* Watermark */}
              <div className="absolute top-3 left-3 bg-stone-900/80 px-2.5 py-1 rounded-md text-[10px] text-stone-300">
                UNIPD VERIFIED RECORDING #{listing.id}
              </div>
            </div>

            {/* Video Controls Bar */}
            <div className="p-3 bg-stone-900 border-t border-stone-800 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPlayingVideo(!isPlayingVideo)}
                  className="bg-white text-stone-900 hover:bg-orange-500 hover:text-white px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  {isPlayingVideo ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  <span>{isPlayingVideo ? t.videoPause : t.videoPlay}</span>
                </button>
                <span className="text-stone-400 font-medium">
                  00:{videoProgress < 10 ? `0${videoProgress}` : videoProgress} / 00:30
                </span>
              </div>

              {/* Progress bar */}
              <div className="flex-1 max-w-md h-2 bg-stone-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-orange-500 transition-all duration-300 rounded-full"
                  style={{ width: `${(videoProgress / 30) * 100}%` }}
                ></div>
              </div>

              <span className="text-[10px] text-emerald-400 font-semibold hidden sm:inline-block">
                {t.videoRealShot}
              </span>
            </div>
          </div>
        )}

        {/* Unified Media Thumbnails Strip: Photos & Video In One Place */}
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5 pt-1">
          {listing.images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => {
                setActiveMediaTab('photos');
                setActivePhotoIndex(idx);
                setIsPlayingVideo(false);
              }}
              className={`relative aspect-video rounded-xl overflow-hidden transition cursor-pointer border ${
                activeMediaTab === 'photos' && activePhotoIndex === idx 
                  ? 'border-orange-600 ring-2 ring-orange-500/30' 
                  : 'border-stone-200 opacity-70 hover:opacity-100'
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
              {activeMediaTab === 'photos' && activePhotoIndex === idx && (
                <span className="absolute bottom-0 inset-x-0 bg-orange-600 text-white text-[9px] font-bold text-center py-0.5">
                  {t.shownPhotoBadge}
                </span>
              )}
            </button>
          ))}

          {/* Video Thumbnail in the same unified gallery strip */}
          {listing.hasVideoTour && (
            <button
              onClick={() => {
                setActiveMediaTab('video');
                setIsPlayingVideo(true);
              }}
              className={`relative aspect-video rounded-xl overflow-hidden transition cursor-pointer border bg-stone-900 ${
                activeMediaTab === 'video'
                  ? 'border-purple-600 ring-2 ring-purple-500/40'
                  : 'border-stone-300 opacity-80 hover:opacity-100'
              }`}
            >
              <img src={listing.images[0]} alt="Video Thumbnail" className="w-full h-full object-cover opacity-60" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 text-white bg-purple-950/40">
                <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center shadow-xs">
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                </div>
                <span className="text-[9px] font-bold tracking-tight">30s Video Tur</span>
              </div>
              {activeMediaTab === 'video' && (
                <span className="absolute bottom-0 inset-x-0 bg-purple-700 text-white text-[9px] font-bold text-center py-0.5">
                  Oynatılıyor
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* 6. Two-Column Content: Description & Specs on Left, Roommates & Poster on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (8 cols): Description, Amenities, Specs Table */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Description Section */}
          <div className="p-5 bg-white rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <h2 className="text-sm md:text-base font-bold uppercase tracking-tight text-stone-900 border-b border-stone-100 pb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange-600" />
              <span>{t.listingDescriptionTitle}</span>
            </h2>
            <div className="text-xs md:text-sm text-stone-600 leading-relaxed space-y-3">
              <p>{listing.description}</p>
            </div>

            {/* Living Rules Badges */}
            <div className="pt-3 border-t border-stone-100">
              <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide block mb-2">
                {t.houseRulesLabel}:
              </span>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="bg-stone-50 border border-stone-200 text-stone-700 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <VolumeX className="w-3.5 h-3.5 text-stone-500" />
                  <span>{t.ruleQuietHours}</span>
                </span>
                <span className="bg-stone-50 border border-stone-200 text-stone-700 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <Ban className="w-3.5 h-3.5 text-rose-500" />
                  <span>{t.ruleNoSmoking}</span>
                </span>
                <span className="bg-stone-50 border border-stone-200 text-stone-700 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-500" />
                  <span>{t.ruleGuests}</span>
                </span>
                <span className="bg-stone-50 border border-stone-200 text-stone-700 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <Ban className="w-3.5 h-3.5 text-amber-500" />
                  <span>{t.ruleNoPets}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Key Amenities Grid */}
          <div className="p-5 bg-white rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <h2 className="text-sm md:text-base font-bold uppercase tracking-tight text-stone-900 border-b border-stone-100 pb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{t.amenitiesTitle}</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              {/* Isıtma */}
              <div className="p-3 border border-stone-200 rounded-xl bg-stone-50/80 flex items-start gap-2.5">
                <Flame className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-stone-900 font-bold block">{t.heatingTypeLabel}</span>
                  <span className="text-stone-600 text-[11px]">
                    {listing.heatingType === 'centralizzato' ? t.heatingCentralizzato : t.heatingAutonomo}
                  </span>
                </div>
              </div>

              {/* Bisiklet Park Yeri (Padova Posto Bici) */}
              <div className={`p-3 border rounded-xl flex items-start gap-2.5 ${listing.hasBikeParking ? 'bg-emerald-50/70 border-emerald-200' : 'bg-stone-50/80 border-stone-200'}`}>
                <Bike className={`w-4 h-4 shrink-0 mt-0.5 ${listing.hasBikeParking ? 'text-emerald-700' : 'text-stone-400'}`} />
                <div>
                  <span className={`font-bold block ${listing.hasBikeParking ? 'text-emerald-950' : 'text-stone-700'}`}>
                    Posto Bici (Padova)
                  </span>
                  <span className={`text-[11px] ${listing.hasBikeParking ? 'text-emerald-800' : 'text-stone-500'}`}>
                    {listing.hasBikeParking ? (listing.bikeParkingDetails || t.bikeParkingBadge) : 'Bisiklet parkı yok'}
                  </span>
                </div>
              </div>

              {/* Otopark / Garaj */}
              <div className={`p-3 border rounded-xl flex items-start gap-2.5 ${listing.hasParking ? 'bg-blue-50/70 border-blue-200' : 'bg-stone-50/80 border-stone-200'}`}>
                <Car className={`w-4 h-4 shrink-0 mt-0.5 ${listing.hasParking ? 'text-blue-700' : 'text-stone-400'}`} />
                <div>
                  <span className={`font-bold block ${listing.hasParking ? 'text-blue-950' : 'text-stone-700'}`}>
                    {t.parkingLabel}
                  </span>
                  <span className={`text-[11px] ${listing.hasParking ? 'text-blue-800' : 'text-stone-500'}`}>
                    {listing.hasParking ? (listing.parkingDetails || t.parkingBadge) : 'Özel otopark yok'}
                  </span>
                </div>
              </div>

              {/* Klima (A/C) */}
              <div className="p-3 border border-stone-200 rounded-xl bg-stone-50/80 flex items-start gap-2.5">
                <Wind className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-stone-900 font-bold block">{t.airConditioningLabel}</span>
                  <span className="text-stone-600 text-[11px]">
                    {listing.hasAirConditioning ? 'Klima (A/C) Mevcut' : 'Klima Yok'}
                  </span>
                </div>
              </div>

              {/* Çamaşır Makinesi */}
              <div className="p-3 border border-stone-200 rounded-xl bg-stone-50/80 flex items-start gap-2.5">
                <span className="text-sm mt-0.5">🧺</span>
                <div>
                  <span className="text-stone-900 font-bold block">{t.washingMachineLabel}</span>
                  <span className="text-stone-600 text-[11px]">
                    {listing.hasWashingMachine ? 'Çamaşır Makinesi Mevcut' : 'Ortak Çamaşırhane'}
                  </span>
                </div>
              </div>

              {/* Wi-Fi / Fiber */}
              <div className="p-3 border border-stone-200 rounded-xl bg-stone-50/80 flex items-start gap-2.5">
                <Wifi className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-stone-900 font-bold block">{t.wifiLabel}</span>
                  <span className="text-stone-600 text-[11px]">
                    {listing.hasWifi !== false ? 'Yüksek Hızlı Fiber Wi-Fi' : 'Wi-Fi Yok'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Technical Specs Table */}
          <div className="p-5 bg-white rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <h2 className="text-sm md:text-base font-bold uppercase tracking-tight text-stone-900 border-b border-stone-100 pb-3 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-stone-700" />
              <span>{t.specsTitle}</span>
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <tbody>
                  <tr className="border-b border-stone-100">
                    <td className="py-2.5 text-stone-400 font-medium uppercase w-1/3">{t.listingNumber}</td>
                    <td className="py-2.5 font-bold text-stone-900">{listing.id}</td>
                  </tr>
                  <tr className="border-b border-stone-100">
                    <td className="py-2.5 text-stone-400 font-medium uppercase">{t.roomTypeLabel}</td>
                    <td className="py-2.5 font-semibold text-stone-800">{listing.roomType}</td>
                  </tr>
                  <tr className="border-b border-stone-100">
                    <td className="py-2.5 text-stone-400 font-medium uppercase">{t.netRoomArea}</td>
                    <td className="py-2.5 font-semibold text-stone-800">{listing.roomM2} m²</td>
                  </tr>
                  <tr className="border-b border-stone-100">
                    <td className="py-2.5 text-stone-400 font-medium uppercase">{t.totalAptArea}</td>
                    <td className="py-2.5 font-semibold text-stone-800">{listing.apartmentM2} m²</td>
                  </tr>
                  <tr className="border-b border-stone-100">
                    <td className="py-2.5 text-stone-400 font-medium uppercase">{t.bathroomsNumber}</td>
                    <td className="py-2.5 font-semibold text-stone-800">{listing.bathrooms}</td>
                  </tr>
                  <tr className="border-b border-stone-100">
                    <td className="py-2.5 text-stone-400 font-medium uppercase">{t.heatingTypeLabel}</td>
                    <td className="py-2.5 font-semibold text-stone-800 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-rose-500" />
                      <span>{listing.heatingType === 'centralizzato' ? t.heatingCentralizzato : t.heatingAutonomo}</span>
                    </td>
                  </tr>
                  <tr className="border-b border-stone-100">
                    <td className="py-2.5 text-stone-400 font-medium uppercase">{t.bikeParkingLabel}</td>
                    <td className="py-2.5 font-semibold text-stone-800 flex items-center gap-1.5">
                      <Bike className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{listing.hasBikeParking ? (listing.bikeParkingDetails || t.bikeParkingBadge) : 'Yok'}</span>
                    </td>
                  </tr>
                  <tr className="border-b border-stone-100">
                    <td className="py-2.5 text-stone-400 font-medium uppercase">{t.parkingLabel}</td>
                    <td className="py-2.5 font-semibold text-stone-800 flex items-center gap-1.5">
                      <Car className="w-3.5 h-3.5 text-blue-600" />
                      <span>{listing.hasParking ? (listing.parkingDetails || t.parkingBadge) : 'Yok'}</span>
                    </td>
                  </tr>
                  <tr className="border-b border-stone-100">
                    <td className="py-2.5 text-stone-400 font-medium uppercase">{t.genderPrefLabel}</td>
                    <td className="py-2.5 font-semibold text-stone-800">
                      {listing.genderPreference === 'female_only' ? t.genderFemaleOnly : listing.genderPreference === 'male_only' ? t.genderMaleOnly : t.genderAny}
                    </td>
                  </tr>
                  <tr className="border-b border-stone-100">
                    <td className="py-2.5 text-stone-400 font-medium uppercase">{t.occupantTypeLabel}</td>
                    <td className="py-2.5 font-semibold text-stone-800">
                      {listing.occupantType === 'students_only' ? t.occupantsStudentsOnly : listing.occupantType === 'workers_only' ? t.occupantsWorkersOnly : t.occupantsMixed}
                    </td>
                  </tr>
                  <tr className="border-b border-stone-100">
                    <td className="py-2.5 text-stone-400 font-medium uppercase">{t.contractModel}</td>
                    <td className="py-2.5 font-semibold text-emerald-800">{listing.contractType}</td>
                  </tr>
                  <tr className="border-b border-stone-100 bg-orange-50/40">
                    <td className="py-2.5 text-orange-900 font-semibold uppercase">{t.contractStartDateLabel}</td>
                    <td className="py-2.5 font-bold text-orange-950 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                      <span>{listing.contractStartDate || t.contractStartImmediate}</span>
                    </td>
                  </tr>
                  {listing.contractDuration && (
                    <tr className="border-b border-stone-100">
                      <td className="py-2.5 text-stone-400 font-medium uppercase">{t.contractDurationLabel}</td>
                      <td className="py-2.5 font-semibold text-stone-800">{listing.contractDuration}</td>
                    </tr>
                  )}
                  <tr className="border-b border-stone-100">
                    <td className="py-2.5 text-stone-400 font-medium uppercase">{t.depositLabel}</td>
                    <td className="py-2.5 font-semibold text-stone-800">€{listing.price * 2} ({t.depositTwoMonths})</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-stone-400 font-medium uppercase">{t.minStay}</td>
                    <td className="py-2.5 font-semibold text-stone-800">{t.minStayValue}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Interactive Location & Street Map */}
          <div className="p-5 bg-white rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between border-b border-stone-100 pb-3 gap-2">
              <h2 className="text-sm md:text-base font-bold uppercase tracking-tight text-stone-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-orange-600" />
                <span>{t.mapTitle}</span>
              </h2>
              <span className="text-[11px] font-semibold text-stone-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-0.5">
                {listing.streetAddress}
              </span>
            </div>

            <div className="text-xs text-stone-600 flex items-center justify-between flex-wrap gap-2">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-orange-600" />
                <strong className="text-stone-900">{listing.distanceToFaculty}</strong> • {listing.district}
              </span>
              <span className="text-[10px] text-stone-400 font-medium">{t.realCoordinates}</span>
            </div>

            <div className="rounded-xl overflow-hidden border border-stone-200">
              <PadovaMap
                listings={[listing]}
                selectedListing={listing}
                height="340px"
                onOpenDetailPage={() => {}}
                onOpenPreviewModal={() => {}}
                currentLang={currentLang}
              />
            </div>
          </div>

        </div>

        {/* Right Column (4 cols): Poster Card & Roommates & Contact */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Poster Profile Card */}
          <div className="p-5 bg-white rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide block">
              {t.listedByStudent}
            </span>

            <div className="flex items-center gap-3.5">
              <img 
                src={listing.poster.avatar} 
                alt={listing.poster.name}
                className="w-14 h-14 rounded-full border border-stone-200 object-cover shadow-xs" 
              />
              <div>
                <h3 className="font-bold text-sm text-stone-900">{listing.poster.name}</h3>
                <span className="text-xs text-orange-600 font-semibold block">@{listing.poster.username}</span>
                <span className="text-[10px] text-stone-500 block">{listing.poster.department}</span>
              </div>
            </div>

            {listing.poster.verifiedUniPD && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-[11px] text-emerald-950 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>{t.unipdVerifiedProfile}</span>
                </div>
                <p className="text-[10px] text-emerald-800 leading-tight">
                  {t.unipdStudentDesc}
                </p>
              </div>
            )}

            <button
              onClick={() => onOpenChat(listing.poster.username, listing.title, listing.id)}
              className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition active:translate-y-0.5 shadow-xs"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{t.chatWithUser} {listing.poster.name}</span>
            </button>
          </div>

          {/* Current Flatmates & Match Algorithm */}
          <div className="p-5 bg-white rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <div className="border-b border-stone-100 pb-3">
              <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide block">
                {t.flatmatesAndMatch}
              </span>
              {listing.compatibilityScore > 0 && (
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-2xl font-bold text-emerald-700">%{listing.compatibilityScore}</span>
                  <span className="text-xs font-medium text-stone-600">{t.highCompatibility} ({listing.compatibilityReason})</span>
                </div>
              )}
            </div>

            {/* Oda Arkadaşı & Ev Profili Özeti */}
            <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-stone-500 font-medium">{t.totalOccupants}:</span>
                <span className="font-bold text-stone-900">{listing.totalHousemates || 3} Kişi</span>
              </div>
              {listing.genderDistribution && (
                <div className="flex items-center justify-between">
                  <span className="text-stone-500 font-medium">{t.genderDistributionLabel}:</span>
                  <span className="font-semibold text-stone-800">{listing.genderDistribution}</span>
                </div>
              )}
              {listing.genderPreference && (
                <div className="flex items-center justify-between">
                  <span className="text-stone-500 font-medium">{t.genderPrefLabel}:</span>
                  <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                    listing.genderPreference === 'female_only'
                      ? 'bg-rose-100 text-rose-800'
                      : listing.genderPreference === 'male_only'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-stone-200 text-stone-700'
                  }`}>
                    {listing.genderPreference === 'female_only' ? t.genderFemaleOnly : listing.genderPreference === 'male_only' ? t.genderMaleOnly : t.genderAny}
                  </span>
                </div>
              )}
              {listing.occupantType && (
                <div className="flex items-center justify-between">
                  <span className="text-stone-500 font-medium">{t.occupantTypeLabel}:</span>
                  <span className="font-semibold text-stone-800">
                    {listing.occupantType === 'students_only' ? t.occupantsStudentsOnly : listing.occupantType === 'workers_only' ? t.occupantsWorkersOnly : t.occupantsMixed}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 pt-1 border-t border-stone-200/60 text-[11px]">
                <span className={`px-2 py-0.5 rounded font-medium ${listing.smokingAllowed ? 'bg-amber-100 text-amber-900' : 'bg-stone-200 text-stone-700'}`}>
                  {listing.smokingAllowed ? `🚬 ${t.smokingAllowed}` : `🚭 ${t.smokingForbidden}`}
                </span>
                <span className={`px-2 py-0.5 rounded font-medium ${listing.petsAllowed ? 'bg-emerald-100 text-emerald-900' : 'bg-stone-200 text-stone-700'}`}>
                  {listing.petsAllowed ? `🐾 ${t.petsAllowed}` : `🚫 ${t.petsForbidden}`}
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              {listing.currentFlatmates.map((flatmate, idx) => (
                <div key={idx} className="p-3 border border-stone-150 rounded-xl bg-stone-50/60 flex items-center gap-3 text-xs">
                  <div className="w-8 h-8 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center shrink-0">
                    <FlatmateIcon iconName={flatmate.icon || flatmate.faculty} className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <strong className="block text-stone-900">{flatmate.name} ({flatmate.age})</strong>
                    <span className="text-[10px] text-stone-500 block">
                      {flatmate.faculty}
                    </span>
                    <span className="text-[10px] text-orange-700 font-semibold block">
                      {flatmate.traits}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Security & Anti-Fraud Warning */}
          <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-1.5 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>{t.securityShield}</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-snug">
              {t.securityWarning}
            </p>
          </div>

        </div>

      </div>

      {/* Mobile Sticky Thumb Action Bar (Thumb-First Ergonomics) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 p-3.5 flex items-center justify-between gap-3 shadow-lg">
        <div className="min-w-0">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-stone-900">€{listing.price}</span>
            <span className="text-[11px] text-stone-500 font-medium">/ {t.perMonth}</span>
          </div>
          <span className="text-[10px] text-stone-500 block truncate">{listing.expenses}</span>
        </div>

        <div className="flex items-center gap-2 flex-1 justify-end">
          <button
            type="button"
            onClick={() => onToggleFavorite(listing.id)}
            className={`w-12 h-12 min-w-[48px] min-h-[48px] flex items-center justify-center rounded-xl border transition active:scale-95 cursor-pointer ${
              isFavorite ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-white border-stone-200 text-stone-700'
            }`}
            title="Favori"
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-rose-600 text-rose-600' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => onOpenChat(listing.poster.username, listing.title, listing.id)}
            className="flex-1 min-h-[48px] bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs uppercase rounded-xl flex items-center justify-center gap-2 shadow-xs active:translate-y-0.5 cursor-pointer transition"
          >
            <MessageSquare className="w-4 h-4 stroke-[2.5]" />
            <span>{t.sendMessage}</span>
          </button>
        </div>
      </div>

      {/* Fullscreen Photo Lightbox Modal */}
      {isPhotoZoomed && (
        <div 
          onClick={() => setIsPhotoZoomed(false)}
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-sm cursor-zoom-out"
        >
          <div className="relative max-w-5xl max-h-[90vh]">
            <img 
              src={listing.images[activePhotoIndex]} 
              alt="Zoomed" 
              className="max-h-[85vh] max-w-full object-contain rounded-xl shadow-2xl" 
            />
            <div className="text-center text-white/80 text-xs mt-3">
              {t.photosCount} {activePhotoIndex + 1} / {listing.images.length} • {t.clickAnywhereToClose}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
