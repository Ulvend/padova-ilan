import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Video, 
  Search, 
  Building2, 
  Users, 
  GraduationCap, 
  DollarSign, 
  ArrowLeft, 
  Copy, 
  Check, 
  Scale, 
  ShieldAlert,
  Lock,
  Archive,
  Key,
  UserCheck,
  UserX,
  Sparkles,
  Calendar,
  Clock,
  TrendingUp,
  FileCheck
} from 'lucide-react';
import { HousingListing, Language, UserProfile } from '../types';

interface SsoVerificationLog {
  id: string;
  name: string;
  matricola: string;
  email: string;
  faculty: string;
  year: string;
  status: 'sso_verified' | 'active_student';
  timestamp: string;
  ssoProvider: string;
}

const INITIAL_SSO_LOGS: SsoVerificationLog[] = [
  {
    id: 'sso-1',
    name: 'Elena Rostova',
    matricola: '2049811',
    email: 'elena.rostova@studenti.unipd.it',
    faculty: 'Medicina e Chirurgia (Policlinico)',
    year: '4. Yıl / 4th Year',
    status: 'sso_verified',
    timestamp: 'Bugün, 09:45',
    ssoProvider: 'UniPD Shibboleth IdP (SAML 2.0)',
  },
  {
    id: 'sso-2',
    name: 'Marco Bellini',
    matricola: '1984210',
    email: 'marco.bellini@studenti.unipd.it',
    faculty: 'Ingegneria Informatica (Portello)',
    year: '2. Yıl Master',
    status: 'sso_verified',
    timestamp: 'Dün, 18:20',
    ssoProvider: 'UniPD Shibboleth IdP (SAML 2.0)',
  },
  {
    id: 'sso-3',
    name: 'Aarav Sharma',
    matricola: '2105432',
    email: 'aarav.sharma@studenti.unipd.it',
    faculty: 'Biotechnology & Molecular Biology',
    year: '1. Yıl Master',
    status: 'sso_verified',
    timestamp: '3 gün önce',
    ssoProvider: 'UniPD Shibboleth IdP (SAML 2.0)',
  },
  {
    id: 'sso-4',
    name: 'Chiara Rossi',
    matricola: '2081934',
    email: 'chiara.rossi@studenti.unipd.it',
    faculty: 'Economia e Management',
    year: '3. Yıl Lisans',
    status: 'sso_verified',
    timestamp: '5 gün önce',
    ssoProvider: 'UniPD Shibboleth IdP (SAML 2.0)',
  },
];

interface AdminPanelProps {
  listings: HousingListing[];
  archivedListings?: HousingListing[];
  onDeleteListing: (id: string) => void;
  onToggleVerifyListing: (id: string) => void;
  onToggleVideoVerified: (id: string) => void;
  onUpdateListingPrice: (id: string, newPrice: number) => void;
  onBackToHome: () => void;
  currentLang: Language;
  currentUser: UserProfile;
  authorizedAdminHashes?: string[];
  onGrantAdminHash?: (hash: string, note?: string) => void;
  onRevokeAdminHash?: (hash: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  listings,
  archivedListings = [],
  onDeleteListing,
  onToggleVerifyListing,
  onToggleVideoVerified,
  onUpdateListingPrice,
  onBackToHome,
  currentLang,
  currentUser,
  authorizedAdminHashes = ['usr_unipd_master_001', 'usr_admin_dii_8421'],
  onGrantAdminHash,
  onRevokeAdminHash,
}) => {
  // Navigation tabs without PostgreSQL database
  const [activeTab, setActiveTab] = useState<'listings' | 'ssoLogs' | 'fairPrice' | 'adminAuth' | 'pastListings'>('listings');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'unverified' | 'highPrice'>('all');
  const [adminNotification, setAdminNotification] = useState<string | null>(null);

  // Admin authorization state
  const [newAdminHash, setNewAdminHash] = useState('');
  const [newAdminNote, setNewAdminNote] = useState('');
  const [hashInputError, setHashInputError] = useState<string | null>(null);
  const [copiedHashText, setCopiedHashText] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setAdminNotification(msg);
    setTimeout(() => setAdminNotification(null), 3500);
  };

  // Authorization check: Is current user Super Admin or authorized admin?
  const isSuperAdmin = currentUser.role === 'superadmin' || currentUser.userHash === 'usr_unipd_master_001';
  const isAuthorizedAdmin = isSuperAdmin || authorizedAdminHashes.includes(currentUser.userHash);

  // If unauthorized user somehow enters, display access denied shield screen
  if (!isAuthorizedAdmin) {
    return (
      <div className="w-full max-w-2xl mx-auto py-12 px-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl border border-rose-200 shadow-lg p-6 sm:p-8 text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-600">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="bg-rose-100 text-rose-800 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Erişim Engellendi (403 Yetkisiz)
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-stone-900">
              Yönetici Paneli Koruması
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
              Her kayıt olan kullanıcı admin olamaz. Bu panele yalnızca <strong>Ana Admin (Super Admin)</strong> tarafından kullanıcı güvenlik hash kodu ile yetki verilmiş yöneticiler erişebilir.
            </p>
          </div>

          <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-2 max-w-md mx-auto text-left">
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
              Sizin Kullanıcı Hash Kodunuz:
            </span>
            <div className="flex items-center justify-between gap-2">
              <code className="text-xs font-mono font-bold text-stone-900 bg-white px-3 py-1.5 rounded-lg border border-stone-200 select-all">
                {currentUser.userHash}
              </code>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(currentUser.userHash);
                  showNotification('Kullanıcı hash kodunuz kopyalandı.');
                }}
                className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Kopyala</span>
              </button>
            </div>
            <p className="text-[11px] text-stone-500">
              Admin yetkisi almak için yukarıdaki hash kodunuzu sistem Ana Admin'ine iletiniz.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={onBackToHome}
              className="bg-stone-900 hover:bg-stone-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Ana Sayfaya Dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handle granting new admin hash
  const handleAddAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHashInputError(null);

    const cleanHash = newAdminHash.trim();
    if (!cleanHash) {
      setHashInputError('Lütfen geçerli bir kullanıcı hash kodu girin.');
      return;
    }

    if (authorizedAdminHashes.includes(cleanHash)) {
      setHashInputError('Bu kullanıcı hash kodu zaten yönetici olarak yetkilendirilmiş.');
      return;
    }

    if (onGrantAdminHash) {
      onGrantAdminHash(cleanHash, newAdminNote.trim());
      showNotification(`"${cleanHash}" koduna yönetici (Admin) yetkisi başarıyla tanımlandı.`);
      setNewAdminHash('');
      setNewAdminNote('');
    }
  };

  // Filter listings
  const filteredListings = listings.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.streetAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.poster.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.district.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'verified') return item.isStudentCardVerified;
    if (statusFilter === 'unverified') return !item.isStudentCardVerified;
    if (statusFilter === 'highPrice') return item.fairPriceStatus === 'higher' || item.price > 450;
    return true;
  });

  // Calculate statistics
  const totalListings = listings.length;
  const verifiedListingsCount = listings.filter(l => l.isStudentCardVerified).length;
  const videoVerifiedCount = listings.filter(l => l.hasVideoTour).length;
  const averageRent = Math.round(listings.reduce((acc, l) => acc + l.price, 0) / (listings.length || 1));
  const highPriceCount = listings.filter(l => l.price > 450 || l.fairPriceStatus === 'higher').length;
  const archivedCount = archivedListings.length;

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {adminNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold flex items-center gap-2 border border-stone-800 animate-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{adminNotification}</span>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="p-5 md:p-6 bg-white rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button 
            onClick={onBackToHome}
            className="text-xs font-semibold text-orange-600 hover:text-orange-700 mb-1.5 flex items-center gap-1 transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{currentLang === 'tr' ? 'Öğrenci Portalı Ana Sayfası' : 'Back to Home'}</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black text-stone-900 tracking-tight">
                  UniPD Konut & Güvenlik Masası
                </h1>
                {isSuperAdmin ? (
                  <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Ana Admin
                  </span>
                ) : (
                  <span className="bg-blue-100 text-blue-900 border border-blue-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Yetkili Admin
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Resmi UniPD SSO oturumları, Canone Concordato tavan kira denetimi ve yetkili yönetici atama masası.
              </p>
            </div>
          </div>
        </div>

        {/* Current Admin Identity Pill */}
        <div className="flex items-center gap-3 bg-stone-50 border border-stone-200 p-2.5 rounded-xl">
          <img 
            src={currentUser.avatar} 
            alt={currentUser.name} 
            className="w-9 h-9 rounded-full object-cover border border-stone-300"
          />
          <div className="text-right">
            <span className="text-xs font-bold text-stone-900 block">{currentUser.name}</span>
            <code className="text-[10px] text-stone-500 font-mono">
              Hash: {currentUser.userHash}
            </code>
          </div>
        </div>
      </div>

      {/* METRICS DASHBOARD */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Yayında İlan</span>
            <Building2 className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl font-black text-stone-900">{totalListings}</div>
          <span className="text-[10px] text-emerald-600 font-semibold">Aktif öğrenci odası</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Geçmiş İlan</span>
            <Archive className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{archivedCount}</div>
          <span className="text-[10px] text-emerald-800 font-semibold">Kiracı bulundu (Arşiv)</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">UniPD SSO Onaylı</span>
            <GraduationCap className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-stone-900">{verifiedListingsCount}</div>
          <span className="text-[10px] text-blue-600 font-semibold">Belgesiz / Resmi IdP</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">30sn Video Tur</span>
            <Video className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-stone-900">{videoVerifiedCount}</div>
          <span className="text-[10px] text-purple-600 font-semibold">Doğrulanmış video</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Ortalama Kira</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-stone-900">€{averageRent}</div>
          <span className="text-[10px] text-stone-500">Aylık Padova oda rayici</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Yetkili Admin</span>
            <Key className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600">{authorizedAdminHashes.length}</div>
          <span className="text-[10px] text-stone-500">Hash ile onaylı</span>
        </div>
      </div>

      {/* NAVIGATION TABS (PostgreSQL REMOVED, SSO & Admin Auth & Past Listings ADDED) */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('listings')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'listings'
              ? 'bg-stone-900 text-white shadow-sm'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>İlan Denetimi & Moderasyon ({listings.length})</span>
        </button>

        {/* REQ 1: SSO Verification Logs (No documents requested) */}
        <button
          type="button"
          onClick={() => setActiveTab('ssoLogs')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'ssoLogs'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>UniPD SSO Doğrulama Masası (Belgesiz)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('fairPrice')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'fairPrice'
              ? 'bg-stone-900 text-white shadow-sm'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Canone Concordato & Tavan Fiyat</span>
        </button>

        {/* REQ 4: Past Listings & Market Trend Data */}
        <button
          type="button"
          onClick={() => setActiveTab('pastListings')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'pastListings'
              ? 'bg-stone-900 text-white shadow-sm'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Archive className="w-4 h-4" />
          <span>Geçmiş İlanlar & Piyasa Veri Ambarı ({archivedCount})</span>
        </button>

        {/* REQ 3: Admin Authorization & User Hash Code Management */}
        <button
          type="button"
          onClick={() => setActiveTab('adminAuth')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'adminAuth'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-amber-800 bg-amber-50 hover:bg-amber-100'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Admin Yetkilendirme Masası (Ana Admin)</span>
        </button>
      </div>

      {/* TAB 1: LISTINGS MODERATION */}
      {activeTab === 'listings' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 md:p-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="İlan başlığı, adres, ilan sahibi..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap ${
                  statusFilter === 'all' ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-600'
                }`}
              >
                Tümü ({listings.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('verified')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap ${
                  statusFilter === 'verified' ? 'bg-emerald-700 text-white' : 'bg-stone-100 text-stone-600'
                }`}
              >
                Onaylı ({verifiedListingsCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('highPrice')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap ${
                  statusFilter === 'highPrice' ? 'bg-rose-600 text-white' : 'bg-stone-100 text-stone-600'
                }`}
              >
                Yüksek Kira ({highPriceCount})
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">İlan Başlığı & Adres</th>
                  <th className="p-3">İlan Sahibi</th>
                  <th className="p-3">Fiyat</th>
                  <th className="p-3">SSO Doğrulama</th>
                  <th className="p-3">Video Tur</th>
                  <th className="p-3 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredListings.map(listing => (
                  <tr key={listing.id} className="hover:bg-stone-50/80 transition">
                    <td className="p-3">
                      <div className="font-bold text-stone-900">{listing.title}</div>
                      <div className="text-[11px] text-stone-500">{listing.streetAddress} • {listing.district}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-stone-800">{listing.poster.name}</div>
                      <div className="text-[10px] text-stone-400">@{listing.poster.username}</div>
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-stone-900">€{listing.price}</span>
                      <div className="text-[10px] text-stone-400">{listing.roomType}</div>
                    </td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => onToggleVerifyListing(listing.id)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 cursor-pointer transition ${
                          listing.isStudentCardVerified
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-stone-100 text-stone-500'
                        }`}
                      >
                        <ShieldCheck className="w-3 h-3" />
                        <span>{listing.isStudentCardVerified ? 'SSO Onaylı' : 'Doğrulanmamış'}</span>
                      </button>
                    </td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => onToggleVideoVerified(listing.id)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 cursor-pointer transition ${
                          listing.hasVideoTour
                            ? 'bg-purple-50 text-purple-800 border border-purple-200'
                            : 'bg-stone-100 text-stone-500'
                        }`}
                      >
                        <Video className="w-3 h-3" />
                        <span>{listing.hasVideoTour ? 'Video Mevcut' : 'Yok'}</span>
                      </button>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteListing(listing.id);
                          showNotification('İlan başarıyla silindi.');
                        }}
                        className="text-stone-400 hover:text-rose-600 hover:bg-rose-50 p-2 rounded-lg transition cursor-pointer"
                        title="İlanı Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: UNIPD SSO VERIFICATION DESK (REQ 1 - NO DOCUMENTS) */}
      {activeTab === 'ssoLogs' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 md:p-6 space-y-4">
          <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-start gap-3">
            <div className="p-2 bg-emerald-100 rounded-xl text-emerald-800 shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="text-xs text-emerald-950 space-y-1">
              <strong className="font-bold text-sm block">
                Belgesiz UniPD Kurumsal SSO (Shibboleth) Kimlik Masası
              </strong>
              <p className="text-emerald-800 leading-relaxed">
                Öğrencilerden kimlik kartı, ikametgah belgesi, öğrenci belgesi veya pasaport gibi <strong>hiçbir evrak talep edilmez</strong>. Üniversite resmi IdP (Identity Provider) üzerinden SAML 2.0 / Shibboleth protokolüyle anlık olarak doğrulanır.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Öğrenci Adı</th>
                  <th className="p-3">UniPD E-Posta</th>
                  <th className="p-3">Fakülte</th>
                  <th className="p-3">Doğrulama Yöntemi</th>
                  <th className="p-3">Tarih</th>
                  <th className="p-3 text-right">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {INITIAL_SSO_LOGS.map(log => (
                  <tr key={log.id} className="hover:bg-stone-50/80 transition">
                    <td className="p-3">
                      <div className="font-bold text-stone-900">{log.name}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-mono text-stone-800">{log.email}</div>
                      <span className="text-[10px] font-bold text-emerald-700">UniPD SSO Onaylı</span>
                    </td>
                    <td className="p-3 text-stone-600">{log.faculty}</td>
                    <td className="p-3">
                      <span className="bg-emerald-50 text-emerald-900 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-semibold">
                        {log.ssoProvider}
                      </span>
                    </td>
                    <td className="p-3 text-stone-400">{log.timestamp}</td>
                    <td className="p-3 text-right">
                      <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-bold text-[10px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>SSO Onaylı (Belgesiz)</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CANONE CONCORDATO FAIR PRICE */}
      {activeTab === 'fairPrice' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 md:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h2 className="text-sm md:text-base font-bold text-stone-900">
                Canone Concordato & Tavan Fiyat Denetimi
              </h2>
              <p className="text-xs text-stone-500">
                Padova Belediyesi öğrenci oda tavan fiyatı: <strong>€410 - €450/ay</strong>
              </p>
            </div>
            <span className="bg-rose-50 text-rose-800 border border-rose-200 px-3 py-1 rounded-full text-xs font-bold">
              {highPriceCount} İlan Risk Altında
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {listings.filter(l => l.price > 430).map(listing => (
              <div key={listing.id} className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-stone-900 text-xs">{listing.title}</h4>
                  <div className="text-[11px] text-stone-500">{listing.district}</div>
                  <div className="text-xs font-bold text-rose-600 mt-1">€{listing.price} / ay</div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateListingPrice(listing.id, 410);
                      showNotification(`"${listing.title}" fiyatı €410 olarak güncellendi.`);
                    }}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Tavana Sabitle (€410)
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteListing(listing.id)}
                    className="text-stone-400 hover:text-rose-600 p-1.5 rounded-lg transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: PAST LISTINGS WAREHOUSE (REQ 4 - HISTORICAL DATA) */}
      {activeTab === 'pastListings' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 md:p-6 space-y-4">
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-start gap-3">
            <div className="p-2 bg-emerald-100 rounded-xl text-emerald-800 shrink-0">
              <Archive className="w-5 h-5" />
            </div>
            <div className="text-xs text-emerald-950 space-y-1">
              <strong className="font-bold text-sm block">
                Geçmiş İlanlar & Piyasa Veri Ambarı
              </strong>
              <p className="text-emerald-800 leading-relaxed">
                İlan sahipleri 'Kiracı Buldum' onayı verdiğinde ilanlar genel arama ve haritadan kaldırılır. Padova kira trendi, ortalama tutulma süresi ve nihai kiralama fiyatlarını analiz etmek üzere bu arşivde saklanır.
              </p>
            </div>
          </div>

          {archivedListings.length === 0 ? (
            <div className="p-10 text-center border border-dashed border-stone-200 rounded-xl space-y-2">
              <Archive className="w-8 h-8 text-stone-400 mx-auto" />
              <p className="text-xs font-semibold text-stone-600">Henüz geçmişe aktarılmış ilan bulunmuyor.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3">İlan Başlığı & Adres</th>
                    <th className="p-3">İlan Sahibi</th>
                    <th className="p-3">Nihai Kira Fiyatı</th>
                    <th className="p-3">Kiracı Tipi</th>
                    <th className="p-3">Kiralama Tarihi</th>
                    <th className="p-3 text-right">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {archivedListings.map(listing => (
                    <tr key={listing.id} className="hover:bg-stone-50/80 transition">
                      <td className="p-3">
                        <div className="font-bold text-stone-900">{listing.title}</div>
                        <div className="text-[11px] text-stone-500">{listing.streetAddress} • {listing.district}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-stone-800">{listing.poster.name}</div>
                        <span className="text-[10px] text-stone-400">@{listing.poster.username}</span>
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-emerald-800 text-sm">€{listing.rentedPrice || listing.price}</span>
                        <div className="text-[10px] text-stone-400">{listing.roomType}</div>
                      </td>
                      <td className="p-3">
                        <span className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded text-[10px] font-medium">
                          {listing.tenantType || 'UniPD Öğrencisi'}
                        </span>
                      </td>
                      <td className="p-3 text-stone-500">{listing.rentedAt || 'Kayıtlı'}</td>
                      <td className="p-3 text-right">
                        <span className="bg-emerald-50 text-emerald-900 border border-emerald-200 px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Kiracı Bulundu (Arşivlendi)</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: ADMIN AUTHORIZATION & HASH PERMISSION (REQ 3 - SUPER ADMIN ONLY) */}
      {activeTab === 'adminAuth' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 md:p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-stone-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-600" />
                <h2 className="text-base font-bold text-stone-900">
                  Admin Yetkilendirme Masası (Ana Admin Yetkisi)
                </h2>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Her kayıt olan admin olamaz. Yalnızca Ana Admin, kullanıcıların hash kodunu buraya girerek yönetici yetkisi verebilir.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 px-3.5 py-2 rounded-xl text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-700" />
              <span className="font-bold text-amber-950">Ana Admin: {currentUser.name}</span>
            </div>
          </div>

          {/* Form to Grant Admin Privileges via User Hash */}
          <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Yeni Yönetici Ekle (Kullanıcı Hash Kodu ile)</span>
            </h3>

            <form onSubmit={handleAddAdminSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-stone-700">
                    Kullanıcı Hash Kodu <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newAdminHash}
                    onChange={(e) => setNewAdminHash(e.target.value)}
                    placeholder="Örn: usr_admin_dii_8421 veya usr_7f8a9e2b1c4d"
                    className="w-full min-h-[42px] px-3.5 text-xs font-mono border border-stone-300 rounded-xl bg-white text-stone-900 outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-stone-700">
                    Yönetici Açıklaması / İsim
                  </label>
                  <input
                    type="text"
                    value={newAdminNote}
                    onChange={(e) => setNewAdminNote(e.target.value)}
                    placeholder="Örn: Marco Bellini - Mühendislik DII Sorumlusu"
                    className="w-full min-h-[42px] px-3.5 text-xs border border-stone-300 rounded-xl bg-white text-stone-900 outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {hashInputError && (
                <p className="text-xs text-rose-600 font-semibold">{hashInputError}</p>
              )}

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-stone-500">
                  Yetki verilen kullanıcı, sonraki girişinde doğrudan Admin Paneline erişebilecektir.
                </span>
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Admin Yetkisi Ver</span>
                </button>
              </div>
            </form>
          </div>

          {/* List of Authorized Admins */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800">
              Yetkilendirilmiş Yöneticiler ({authorizedAdminHashes.length})
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3">Kullanıcı Hash Kodu</th>
                    <th className="p-3">Rol & Durum</th>
                    <th className="p-3">Yetki Türü</th>
                    <th className="p-3 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {authorizedAdminHashes.map(hash => {
                    const isMaster = hash === 'usr_unipd_master_001';
                    return (
                      <tr key={hash} className="hover:bg-stone-50/80 transition">
                        <td className="p-3">
                          <code className="font-mono font-bold text-stone-900 bg-stone-100 px-2 py-1 rounded border border-stone-200">
                            {hash}
                          </code>
                        </td>
                        <td className="p-3">
                          {isMaster ? (
                            <span className="font-bold text-amber-900">Cenk B. Şimşek (Sistem Kurucusu)</span>
                          ) : (
                            <span className="text-stone-700 font-medium">Yetkili Yönetici</span>
                          )}
                        </td>
                        <td className="p-3">
                          {isMaster ? (
                            <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                              Ana Admin (Kaldırılamaz)
                            </span>
                          ) : (
                            <span className="bg-blue-100 text-blue-900 border border-blue-300 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                              Yetkili Admin
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {isMaster ? (
                            <span className="text-stone-400 text-[11px] italic">Korumalı</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                if (onRevokeAdminHash) {
                                  onRevokeAdminHash(hash);
                                  showNotification(`"${hash}" yöneticilik yetkisi kaldırıldı.`);
                                }
                              }}
                              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer"
                            >
                              Yetkiyi Kaldır
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
