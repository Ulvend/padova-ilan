import React, { useState } from 'react';
import { 
  Plus, 
  CheckCircle2, 
  Clock, 
  Eye, 
  Trash2, 
  Video, 
  Archive, 
  Sparkles, 
  X, 
  Check, 
  RotateCcw, 
  Building2, 
  TrendingUp, 
  Calendar, 
  Coins, 
  ArrowLeft,
  Pencil
} from 'lucide-react';
import { HousingListing, Language, UserProfile } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { getLocalizedListing } from '../utils/listingTranslator';

interface MyListingsViewProps {
  myListings: HousingListing[];
  archivedListings?: HousingListing[];
  onOpenCreateModal: () => void;
  onEditListing?: (listing: HousingListing) => void;
  onSelectListing: (listing: HousingListing) => void;
  onOpenVideoTour: (listing: HousingListing) => void;
  onDeleteListing: (id: string) => void;
  onMarkAsRented?: (listingId: string, details?: { rentedPrice: number; tenantType: string; note?: string }) => void;
  onReactivateListing?: (listingId: string) => void;
  onBackToHome: () => void;
  currentLang?: Language;
  currentUser?: UserProfile;
}

export const MyListingsView: React.FC<MyListingsViewProps> = ({
  myListings,
  archivedListings = [],
  onOpenCreateModal,
  onEditListing,
  onSelectListing,
  onOpenVideoTour,
  onDeleteListing,
  onMarkAsRented,
  onReactivateListing,
  onBackToHome,
  currentLang = 'tr',
  currentUser,
}) => {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.tr;
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');

  // Confirmation Modal state for "Kiracı Buldum"
  const [selectedListingForRent, setSelectedListingForRent] = useState<HousingListing | null>(null);
  const [rentedPrice, setRentedPrice] = useState<number>(420);
  const [tenantType, setTenantType] = useState<string>('UniPD Öğrencisi');
  const [rentalNote, setRentalNote] = useState<string>('');

  const openRentConfirmation = (listing: HousingListing) => {
    setSelectedListingForRent(listing);
    setRentedPrice(listing.price);
    setTenantType('UniPD Lisans/Master Öğrencisi');
    setRentalNote('');
  };

  const handleConfirmRented = () => {
    if (!selectedListingForRent || !onMarkAsRented) return;
    onMarkAsRented(selectedListingForRent.id, {
      rentedPrice,
      tenantType,
      note: rentalNote
    });
    setSelectedListingForRent(null);
  };

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="p-5 md:p-6 bg-white rounded-2xl border border-stone-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <button 
            onClick={onBackToHome}
            className="text-xs font-semibold text-orange-600 hover:text-orange-700 mb-1.5 flex items-center gap-1 transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t.backToHome}</span>
          </button>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-stone-900">
            {t.myListingsTitle}
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            {t.accountVerified}: @{currentUser?.username || 'ogrenci'}
          </p>
        </div>

        <button 
          onClick={onOpenCreateModal}
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wide flex items-center gap-2 shadow-xs transition active:translate-y-0.5 cursor-pointer min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          <span>{t.postNewRoom}</span>
        </button>
      </div>

      {/* Sub Tabs: Aktif İlanlar vs. Geçmiş İlanlar (Kiracı Bulunanlar) */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'active'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>{currentLang === 'tr' ? 'Yayındaki Aktif İlanlarım' : 'Active Listings'}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            activeTab === 'active' ? 'bg-stone-800 text-orange-400' : 'bg-stone-200 text-stone-700'
          }`}>
            {myListings.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('archived')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'archived'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <Archive className="w-3.5 h-3.5" />
          <span>{currentLang === 'tr' ? 'Geçmiş İlanlar & Kiracı Bulunanlar' : 'Past & Rented Listings'}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            activeTab === 'archived' ? 'bg-emerald-900 text-emerald-300' : 'bg-stone-200 text-stone-700'
          }`}>
            {archivedListings.length}
          </span>
        </button>
      </div>

      {/* ACTIVE LISTINGS TAB CONTENT */}
      {activeTab === 'active' && (
        <>
          {myListings.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-2xl border border-stone-200 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto">
                <Building2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-stone-700">{t.noListingsYet}</p>
              <p className="text-xs text-stone-400 max-w-sm mx-auto">
                {currentLang === 'tr' 
                  ? 'Şu anda yayında aktif ilanınız bulunmamaktadır. Kiracı bulduğunuz ilanlar Geçmiş İlanlar sekmesinde arşivlenir.' 
                  : 'You currently have no active listings. Listings marked as rented are moved to Past Listings.'}
              </p>
              <button 
                onClick={onOpenCreateModal} 
                className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition min-h-[44px] cursor-pointer"
              >
                {t.postAdBtn}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {myListings.map((rawListing) => {
                const listing = getLocalizedListing(rawListing, currentLang);
                return (
                  <div 
                    key={listing.id}
                    className="p-5 bg-white rounded-2xl border border-stone-200 shadow-sm space-y-3.5 hover:border-orange-200 transition"
                  >
                    <div className="flex flex-wrap items-start justify-between border-b border-stone-100 pb-3 gap-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                          <span>{t.liveListing}</span>
                        </span>
                        <span className="text-xs text-stone-500 font-medium">{listing.district}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-xl font-bold text-stone-900">€{listing.price}</span>
                        <span className="text-[11px] text-stone-500">{listing.expenses}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 
                          onClick={() => onSelectListing(rawListing)}
                          className="font-bold text-base text-stone-900 hover:text-orange-600 cursor-pointer transition"
                        >
                          {listing.title}
                        </h3>
                        <div className="text-xs text-stone-500 flex flex-wrap items-center gap-2 mt-1">
                          <span>{listing.streetAddress}</span>
                          <span>•</span>
                          <span>{listing.roomType}</span>
                          <span>•</span>
                          <span className="text-emerald-700 font-medium">{listing.contractType}</span>
                          {listing.contractStartDate && (
                            <>
                              <span>•</span>
                              <span className="text-orange-800 font-semibold bg-orange-50 px-2 py-0.5 rounded border border-orange-200/60 inline-flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-orange-600" />
                                <span>{t.contractStartDateLabel}: {listing.contractStartDate}</span>
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Action buttons including "Kiracı Buldum" */}
                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        {/* İlanı Düzenle Button */}
                        <button
                          type="button"
                          onClick={() => onEditListing?.(rawListing)}
                          className="border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer min-h-[40px] flex items-center gap-1.5 shadow-2xs active:scale-95"
                          title="İlanı, fotoğrafları ve videoyu düzenle"
                        >
                          <Pencil className="w-4 h-4 text-amber-600" />
                          <span>{currentLang === 'tr' ? 'Düzenle' : currentLang === 'it' ? 'Modifica' : 'Edit'}</span>
                        </button>

                        {/* REQ 4: "Kiracı Buldum" Button */}
                        <button
                          type="button"
                          onClick={() => openRentConfirmation(rawListing)}
                          className="border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer min-h-[40px] flex items-center gap-1.5 shadow-2xs active:scale-95"
                          title="İlan için kiracı buldum, yayından kaldır ve geçmişe kaydet"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>{currentLang === 'tr' ? 'Kiracı Buldum' : 'Found Tenant'}</span>
                        </button>

                        {listing.hasVideoTour && (
                          <button 
                            onClick={() => onOpenVideoTour(rawListing)}
                            className="border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-900 px-3 py-2 text-xs font-semibold rounded-xl transition cursor-pointer min-h-[40px] flex items-center gap-1.5"
                          >
                            <Video className="w-3.5 h-3.5 text-purple-700" />
                            <span>{t.tabVideo}</span>
                          </button>
                        )}

                        <button 
                          onClick={() => onSelectListing(rawListing)}
                          className="border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 px-3.5 py-2 text-xs font-semibold rounded-xl transition cursor-pointer min-h-[40px]"
                        >
                          {t.viewDetails}
                        </button>

                        <button 
                          onClick={() => onDeleteListing(listing.id)}
                          className="border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 p-2 text-xs font-semibold rounded-xl transition cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
                          title={t.deleteListing}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-stone-100 flex flex-wrap items-center justify-between text-xs text-stone-500 gap-2">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5 text-stone-400" />
                          <strong className="text-stone-700">{listing.views}</strong>
                        </span>
                        <span className="flex items-center gap-1 text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {t.padovaComuneAudit}
                        </span>
                      </div>
                      <span className="text-orange-600 font-medium">
                        {listing.confirmationTimeLeft}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ARCHIVED / PAST LISTINGS TAB CONTENT (Kiracı Bulunanlar) */}
      {activeTab === 'archived' && (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-start gap-3">
            <div className="p-2 bg-emerald-100 rounded-xl text-emerald-800 shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="text-xs text-emerald-950 space-y-0.5">
              <strong className="font-bold block">
                {currentLang === 'tr' ? 'Geçmiş İlanlar & Piyasa Veri Kaydı' : 'Archived Listings & Market Trend Data'}
              </strong>
              <p className="text-emerald-800 leading-snug">
                {currentLang === 'tr'
                  ? 'Kiracı bulunan ilanlar yayından güvenle kaldırılmış olup, veri tabanında Padova emsal kira analizleri ve piyasa istatistikleri için geçmiş veri olarak saklanmaktadır.'
                  : 'Rented listings are removed from public search and safely stored in the database for historical market rate analytics.'}
              </p>
            </div>
          </div>

          {archivedListings.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-2xl border border-stone-200 shadow-sm space-y-2">
              <Archive className="w-8 h-8 text-stone-400 mx-auto" />
              <p className="text-sm font-semibold text-stone-700">
                {currentLang === 'tr' ? 'Henüz geçmişe aktarılan ilan bulunmuyor' : 'No past listings found'}
              </p>
              <p className="text-xs text-stone-400 max-w-sm mx-auto">
                {currentLang === 'tr'
                  ? 'Aktif ilanlarınızdan kiracı bulduğunuzda "Kiracı Buldum" butonuna basarak ilanı bu arşive aktarabilirsiniz.'
                  : 'When you find a tenant for your active listing, click "Found Tenant" to archive it here.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {archivedListings.map((rawListing) => {
                const listing = getLocalizedListing(rawListing, currentLang);
                return (
                  <div
                    key={listing.id}
                    className="p-5 bg-stone-50/60 rounded-2xl border border-stone-200 shadow-xs space-y-3 opacity-95"
                  >
                    <div className="flex flex-wrap items-start justify-between border-b border-stone-200 pb-3 gap-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                          <Check className="w-3.5 h-3.5 text-emerald-700" />
                          <span>{currentLang === 'tr' ? 'Kiracı Bulundu (Arşiv Verisi)' : 'Tenant Found (Archived)'}</span>
                        </span>
                        <span className="text-xs text-stone-500 font-medium">{listing.district}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-stone-500 font-medium">Kiralama Fiyatı:</span>
                        <span className="text-lg font-bold text-stone-900">
                          €{rawListing.rentedPrice || rawListing.price}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-base text-stone-900">
                          {listing.title}
                        </h3>
                        <div className="text-xs text-stone-500 flex flex-wrap items-center gap-2 mt-1">
                          <span>{listing.streetAddress}</span>
                          <span>•</span>
                          <span>{listing.roomType}</span>
                          <span>•</span>
                          <span className="text-emerald-800 font-medium">{listing.contractType}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {onReactivateListing && (
                          <button
                            type="button"
                            onClick={() => onReactivateListing(rawListing.id)}
                            className="border border-stone-300 bg-white hover:bg-stone-100 text-stone-800 px-3 py-1.5 text-xs font-semibold rounded-xl transition cursor-pointer flex items-center gap-1.5"
                            title="Kiracı anlaşması bozulduysa tekrar aktif ilana dönüştür"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-stone-600" />
                            <span>{currentLang === 'tr' ? 'Tekrar Yayına Al' : 'Reactivate'}</span>
                          </button>
                        )}

                        <button 
                          onClick={() => onSelectListing(rawListing)}
                          className="border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition cursor-pointer"
                        >
                          {t.viewDetails}
                        </button>
                      </div>
                    </div>

                    {/* Historical metadata summary */}
                    <div className="pt-2.5 border-t border-stone-200 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-stone-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-stone-400" />
                        <span>Kiralama Tarihi: <strong className="text-stone-800">{rawListing.rentedAt || 'Kayıtlı'}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Kiracı Tipi: <strong className="text-stone-800">{rawListing.tenantType || 'UniPD Öğrencisi'}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-stone-400" />
                        <span>Toplam Görüntülenme: <strong className="text-stone-800">{listing.views}</strong></span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CONFIRMATION MODAL: "Kiracı Buldum" */}
      {selectedListingForRent && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setSelectedListingForRent(null)}
        >
          <div 
            className="bg-white w-full max-w-md rounded-2xl border border-stone-200 shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-emerald-50/60">
              <div className="flex items-center gap-2">
                <span className="bg-emerald-600 text-white p-1 rounded-lg">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
                <span className="font-bold text-xs uppercase tracking-wider text-emerald-950">
                  Kiracı Bulundu Onay Masası
                </span>
              </div>
              <button
                onClick={() => setSelectedListingForRent(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-stone-900">
                  Tebrikler! Kiracı Buldunuz Mu?
                </h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Onay vermeniz durumunda <strong>"{selectedListingForRent.title}"</strong> ilanı aktif yayından kaldırılacak ve veri ambarında <strong>"Geçmiş İlan"</strong> olarak saklanacaktır.
                </p>
              </div>

              {/* Data fields for market analytics */}
              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-stone-700">
                    Anlaşılan Nihai Kira Bedeli (€/ay)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={rentedPrice}
                      onChange={(e) => setRentedPrice(Number(e.target.value))}
                      className="w-full min-h-[42px] px-3.5 pl-9 text-xs sm:text-sm border border-stone-300 rounded-xl bg-white text-stone-900 outline-none focus:border-emerald-500"
                    />
                    <Coins className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-stone-700">
                    Kiracı Profili
                  </label>
                  <select
                    value={tenantType}
                    onChange={(e) => setTenantType(e.target.value)}
                    className="w-full min-h-[42px] px-3 text-xs sm:text-sm border border-stone-300 rounded-xl bg-white text-stone-900 outline-none focus:border-emerald-500"
                  >
                    <option value="UniPD Tıp / Mühendislik Öğrencisi">UniPD Tıp / Mühendislik Öğrencisi</option>
                    <option value="UniPD Lisans / Master Öğrencisi">UniPD Lisans / Master Öğrencisi</option>
                    <option value="Erasmus+ Değişim Öğrencisi">Erasmus+ Değişim Öğrencisi</option>
                    <option value="Doktora / Doktora Sonrası Araştırmacı">Doktora / Doktora Sonrası Araştırmacı</option>
                    <option value="Genç Çalışan / Mezun">Genç Çalışan / Mezun</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-stone-700">
                    Kiralama Notu (İsteğe Bağlı)
                  </label>
                  <input
                    type="text"
                    value={rentalNote}
                    onChange={(e) => setRentalNote(e.target.value)}
                    placeholder="Örn: 1 yıllık Canone Concordato sözleşmesi imzalandı"
                    className="w-full min-h-[42px] px-3.5 text-xs border border-stone-300 rounded-xl bg-white text-stone-900 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedListingForRent(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-stone-600 hover:bg-stone-100 transition cursor-pointer"
                >
                  Vazgeç
                </button>

                <button
                  type="button"
                  onClick={handleConfirmRented}
                  className="px-5 py-2.5 text-xs font-bold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Evet, Kiracı Buldum (İlanı Arşivle)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
