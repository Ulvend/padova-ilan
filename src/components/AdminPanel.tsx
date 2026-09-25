import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  Trash2, 
  Video, 
  Search, 
  Building2, 
  GraduationCap, 
  DollarSign, 
  ArrowLeft, 
  Copy, 
  ShieldAlert,
  Lock,
  Archive,
  Key,
  UserCheck,
  UserSearch,
  Ban,
  RotateCcw,
  Flag,
  ScrollText,
  ImageOff
} from 'lucide-react';
import { HousingListing, Language, UserProfile } from '../types';
import type { PublicUserProfile } from '../services/supabaseService';
import { useApp } from '../context/AppContext';
import { ReportsPanel } from './ReportsPanel';
import { AuditLogPanel } from './AuditLogPanel';
import { PhotoFlagsPanel } from './PhotoFlagsPanel';
import {
  getReports,
  updateReportStatus,
  adminFindUsers,
  adminBanUser,
  adminUnbanUser,
  getBannedUsers,
  getPhotoDuplicateFlags,
  updatePhotoFlagStatus,
  type PhotoDuplicateFlag,
  type PhotoFlagStatus,
  type Report,
  type ReportStatus,
  type AdminUserMatch,
  type BanResult,
  type BannedUser,
} from '../services/supabaseService';


interface AdminPanelProps {
  listings: HousingListing[];
  archivedListings?: HousingListing[];
  onDeleteListing: (id: string) => Promise<boolean> | void;
  onToggleVerifyListing: (id: string) => void;
  onToggleVideoVerified: (id: string) => void;
  onBackToHome: () => void;
  currentLang: Language;
  currentUser: UserProfile;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  verifiedUsers?: PublicUserProfile[];
  authorizedAdminHashes?: string[];
  onGrantAdminHash?: (uid: string, note?: string) => Promise<void>;
  onRevokeAdminHash?: (uid: string) => Promise<void>;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  listings,
  archivedListings = [],
  onDeleteListing,
  onToggleVerifyListing,
  onToggleVideoVerified,
  onBackToHome,
  currentLang,
  currentUser,
  isAdmin,
  isSuperAdmin,
  verifiedUsers = [],
  authorizedAdminHashes = [],
  onGrantAdminHash,
  onRevokeAdminHash,
}) => {
  const { getPriceInsight } = useApp();
  const isPricedHigh = (l: HousingListing) => getPriceInsight(l).status === 'higher';
  const [activeTab, setActiveTab] = useState<'listings' | 'ssoLogs' | 'adminAuth' | 'pastListings' | 'reports' | 'userLookup' | 'banned' | 'auditLog' | 'photoFlags'>('listings');

  // Şikayetler: yalnızca yöneticiler okuyabilir (RLS); sekme etiketindeki bekleyen sayısı için baştan yüklenir.
  const [reports, setReports] = useState<Report[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  // Banlı kullanıcılar: "Banlı Kullanıcılar" sekmesinde listelenir; şikayet kartındaki "Banla" / "Banı Kaldır" da buna göre.
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const bannedIds = bannedUsers.map((u) => u.userId);
  // Başka kullanıcının fotoğrafına benzeyen yüklemeler (yalnızca bekleyenler listelenir).
  const [photoFlags, setPhotoFlags] = useState<PhotoDuplicateFlag[]>([]);
  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    Promise.all([getReports(), getBannedUsers(), getPhotoDuplicateFlags()]).then(([list, banned, flags]) => {
      if (cancelled) return;
      setReports(list);
      setBannedUsers(banned);
      setPhotoFlags(flags);
      setReportsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);
  const pendingReportCount = reports.filter((r) => r.status === 'pending').length;
  const handlePhotoFlagStatus = async (id: number, status: PhotoFlagStatus) => {
    await updatePhotoFlagStatus(id, status);
    setPhotoFlags((prev) => prev.filter((f) => f.id !== id));
  };
  const handleBanForPhotoFlag = async (userId: string, reason: string): Promise<BanResult> => {
    const result = await adminBanUser(userId, reason);
    if (result === 'ok') {
      getBannedUsers().then(setBannedUsers);
      showNotification('Kullanıcı banlandı; ilanları yayından kaldırıldı.');
    }
    return result;
  };
  const handleReportStatus = async (id: string, status: ReportStatus) => {
    await updateReportStatus(id, status);
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  // İlan silinince şikayetleri de veritabanında silinir (on delete cascade); listeden de düşürülür.
  const handleReportDeleteListing = async (listingId: string): Promise<boolean> => {
    const ok = (await onDeleteListing(listingId)) !== false;
    if (ok) {
      setReports((prev) => prev.filter((r) => r.targetListingId !== listingId));
      showNotification('İlan silindi.');
    }
    return ok;
  };

  const handleBanUser = async (userId: string, reason: string, reportId: string): Promise<BanResult> => {
    const result = await adminBanUser(userId, reason, reportId);
    if (result === 'ok') {
      // Gerekçe ve profil adıyla birlikte güncel liste yeniden okunur.
      getBannedUsers().then(setBannedUsers);
      // Sunucu bu kullanıcıyla ve ilanlarıyla ilgili bekleyen şikayetleri incelendi olarak işaretledi.
      setReports((prev) =>
        prev.map((r) =>
          r.status === 'pending' && (r.targetUserId === userId || r.targetListingOwnerId === userId)
            ? { ...r, status: 'reviewed' }
            : r
        )
      );
      showNotification('Kullanıcı banlandı; ilanları yayından kaldırıldı.');
    }
    return result;
  };

  const handleUnbanUser = async (userId: string) => {
    await adminUnbanUser(userId);
    setBannedUsers((prev) => prev.filter((u) => u.userId !== userId));
    showNotification('Ban kaldırıldı. Kullanıcının arşivlenen ilanları arşivde kalır; kendisi yeniden yayınlayabilir.');
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'unverified' | 'highPrice'>('all');
  const [adminNotification, setAdminNotification] = useState<string | null>(null);

  // Admin authorization state
  const [newAdminHash, setNewAdminHash] = useState('');
  const [newAdminNote, setNewAdminNote] = useState('');
  const [hashInputError, setHashInputError] = useState<string | null>(null);

  // Kullanıcı bul: UID normal kullanıcılara gösterilmediği için adminler kimliği e-posta/kullanıcı adıyla bulur.
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupResults, setLookupResults] = useState<AdminUserMatch[] | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const handleLookupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = lookupQuery.trim();
    if (q.replace(/^@/, '').length < 2) {
      setLookupError('En az 2 karakter girin.');
      return;
    }
    setLookupError(null);
    setLookupLoading(true);
    try {
      setLookupResults(await adminFindUsers(q));
    } catch (err) {
      console.error('User lookup error:', err);
      setLookupResults(null);
      setLookupError('Arama yapılamadı. Yönetici olarak giriş yaptığınızdan emin olun.');
    } finally {
      setLookupLoading(false);
    }
  };

  const showNotification = (msg: string) => {
    setAdminNotification(msg);
    setTimeout(() => setAdminNotification(null), 3500);
  };

  // Yetki AppContext'ten gelir; asıl koruma veritabanı kurallarındadır (RLS).
  if (!isAdmin) {
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
              Her kayıt olan kullanıcı admin olamaz. Bu panele yalnızca <strong>Ana Admin (Super Admin)</strong> tarafından yetki verilmiş yöneticiler erişebilir.
            </p>
          </div>

          <p className="p-4 bg-stone-50 border border-stone-200 rounded-xl max-w-md mx-auto text-[11px] text-stone-600">
            Admin yetkisi almak için Ana Admin'e kayıtlı e-posta adresinizi veya kullanıcı adınızı iletin.
          </p>

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

  // Yeni admin: kullanıcının UID'si ile admins/{uid} kaydı oluşturulur (yalnızca ana admin).
  const handleAddAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHashInputError(null);

    const cleanUid = newAdminHash.trim().toLowerCase();
    // Supabase kullanıcı kimlikleri UUID biçimindedir.
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanUid)) {
      setHashInputError('Lütfen geçerli bir kullanıcı kimliği (UID) girin. Kimliği "Kullanıcı Bul" sekmesinden e-posta veya kullanıcı adıyla bulabilirsiniz.');
      return;
    }
    if (authorizedAdminHashes.includes(cleanUid)) {
      setHashInputError('Bu kullanıcı zaten yönetici.');
      return;
    }
    if (!onGrantAdminHash) return;
    try {
      await onGrantAdminHash(cleanUid, newAdminNote.trim());
      showNotification('Yönetici yetkisi verildi.');
      setNewAdminHash('');
      setNewAdminNote('');
    } catch (err) {
      console.error('Grant admin error:', err);
      setHashInputError('Yetki verilemedi. Ana admin olarak giriş yaptığınızdan emin olun.');
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
    if (statusFilter === 'highPrice') return isPricedHigh(item);
    return true;
  });

  // Calculate statistics
  const totalListings = listings.length;
  const verifiedListingsCount = listings.filter(l => l.isStudentCardVerified).length;
  const videoVerifiedCount = listings.filter(l => l.hasVideoTour).length;
  const averageRent = Math.round(listings.reduce((acc, l) => acc + l.price, 0) / (listings.length || 1));
  const highPriceCount = listings.filter(isPricedHigh).length;
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
                İlan denetimi, UniPD doğrulamaları, şikayet ve ban yönetimi, yönetici atama masası.
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
              UID: {currentUser.userHash}
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
          <span className="text-[10px] text-emerald-800 font-semibold">Arşivdeki ilanlar</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">UniPD Onaylı</span>
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
          <span className="text-[10px] text-stone-500">UID ile yetkili</span>
        </div>
      </div>

      {/* Sekmeler */}
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
          <span>UniPD Doğrulanmış Kullanıcılar</span>
        </button>

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

        <button
          type="button"
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'reports'
              ? 'bg-rose-700 text-white shadow-sm'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Flag className="w-4 h-4" />
          <span>Şikayetler{pendingReportCount > 0 ? ` (${pendingReportCount})` : ''}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('banned')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'banned'
              ? 'bg-stone-900 text-white shadow-sm'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Ban className="w-4 h-4" />
          <span>Banlı Kullanıcılar ({bannedUsers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('userLookup')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'userLookup'
              ? 'bg-stone-900 text-white shadow-sm'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <UserSearch className="w-4 h-4" />
          <span>Kullanıcı Bul</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('photoFlags')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'photoFlags'
              ? 'bg-stone-900 text-white shadow-sm'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <ImageOff className="w-4 h-4" />
          <span>Şüpheli Fotoğraflar ({photoFlags.length})</span>
        </button>

        {/* Admin yetkilendirme (yalnızca ana admin) */}
        {isSuperAdmin && (
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
        )}

        {/* Admin işlem kaydı (yalnızca ana admin) */}
        {isSuperAdmin && (
        <button
          type="button"
          onClick={() => setActiveTab('auditLog')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'auditLog'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-amber-800 bg-amber-50 hover:bg-amber-100'
          }`}
        >
          <ScrollText className="w-4 h-4" />
          <span>İşlem Kaydı (Ana Admin)</span>
        </button>
        )}
      </div>

      {activeTab === 'auditLog' && isSuperAdmin && <AuditLogPanel />}

      {activeTab === 'photoFlags' && (
        <PhotoFlagsPanel
          flags={photoFlags}
          loading={reportsLoading}
          bannedIds={bannedIds}
          onStatus={handlePhotoFlagStatus}
          onBan={handleBanForPhotoFlag}
        />
      )}

      {/* Banlı kullanıcılar: banı buradan kaldırılır (şikayeti silinmiş kullanıcılar dahil) */}
      {activeTab === 'banned' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 md:p-6 space-y-4">
          <div className="border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <Ban className="w-5 h-5 text-rose-600" />
              <h2 className="text-base font-bold text-stone-900">Banlı Kullanıcılar</h2>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Banı kaldırılan kullanıcı yeniden giriş yapabilir. Ban sırasında arşivlenen ilanları arşivde kalır; kullanıcı isterse kendisi yeniden yayınlar.
            </p>
          </div>

          {reportsLoading ? (
            <p className="text-xs text-stone-500 py-6 text-center">Yükleniyor…</p>
          ) : bannedUsers.length === 0 ? (
            <p className="text-sm text-stone-500 py-8 text-center">Banlı kullanıcı yok.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3">Kullanıcı</th>
                    <th className="p-3">Gerekçe</th>
                    <th className="p-3">Ban Tarihi</th>
                    <th className="p-3 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {bannedUsers.map((u) => (
                    <tr key={u.userId} className="hover:bg-stone-50/80 transition align-top">
                      <td className="p-3">
                        <span className="block font-bold text-stone-900">{u.name || '—'}</span>
                        <span className="block text-orange-600 font-semibold">{u.username ? `@${u.username}` : '—'}</span>
                        <code className="block mt-1 font-mono text-[10px] text-stone-400 break-all">{u.userId}</code>
                      </td>
                      <td className="p-3 text-stone-700 max-w-xs whitespace-pre-wrap">{u.reason || '—'}</td>
                      <td className="p-3 text-stone-500 whitespace-nowrap">{new Date(u.createdAt).toLocaleDateString('tr-TR')}</td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await handleUnbanUser(u.userId);
                            } catch (err) {
                              console.error('Unban error:', err);
                              showNotification('Ban kaldırılamadı. Lütfen tekrar deneyin.');
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 text-xs font-bold rounded-lg cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Banı Kaldır
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* KULLANICI BUL: e-posta / kullanıcı adı ile UID */}
      {activeTab === 'userLookup' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 md:p-6 space-y-5">
          <div className="border-b border-stone-100 pb-4">
            <div className="flex items-center gap-2">
              <UserSearch className="w-5 h-5 text-stone-700" />
              <h2 className="text-base font-bold text-stone-900">Kullanıcı Bul</h2>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Kullanıcı kimliği (UID) normal kullanıcılara gösterilmez. Bir kullanıcının kimliğini kayıtlı e-posta adresi veya kullanıcı adıyla buradan bulabilirsiniz.
            </p>
          </div>

          <form onSubmit={handleLookupSubmit} className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={lookupQuery}
                onChange={(e) => setLookupQuery(e.target.value)}
                placeholder="E-posta veya kullanıcı adı (örn. ad.soyad@studenti.unipd.it, @kullanici)"
                aria-label="E-posta veya kullanıcı adı"
                className="w-full min-h-[44px] pl-10 pr-3.5 text-sm border border-stone-300 rounded-xl bg-white text-stone-900 outline-none focus:border-stone-500"
              />
            </div>
            <button
              type="submit"
              disabled={lookupLoading}
              className="min-h-[44px] px-5 bg-stone-900 hover:bg-stone-800 disabled:opacity-60 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>{lookupLoading ? 'Aranıyor…' : 'Ara'}</span>
            </button>
          </form>

          {lookupError && <p className="text-xs text-rose-600 font-semibold">{lookupError}</p>}

          {lookupResults && (
            lookupResults.length === 0 ? (
              <p className="text-xs text-stone-500 py-2">Eşleşen kullanıcı bulunamadı.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-200 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3">Kullanıcı</th>
                      <th className="p-3">E-posta</th>
                      <th className="p-3">Kullanıcı Kimliği (UID)</th>
                      <th className="p-3 text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {lookupResults.map((u) => {
                      const alreadyAdmin = authorizedAdminHashes.includes(u.id) || u.id === currentUser.userHash;
                      return (
                        <tr key={u.id} className="hover:bg-stone-50/80 transition">
                          <td className="p-3">
                            <span className="block font-bold text-stone-900">{u.name || '—'}</span>
                            <span className="block text-orange-600 font-semibold">{u.username ? `@${u.username}` : '—'}</span>
                          </td>
                          <td className="p-3 text-stone-700 break-all">{u.email || '—'}</td>
                          <td className="p-3">
                            <code className="font-mono text-[11px] font-bold text-stone-900 bg-stone-100 px-2 py-1 rounded border border-stone-200 select-all break-all">
                              {u.id}
                            </code>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(u.id);
                                  showNotification('Kullanıcı kimliği kopyalandı.');
                                }}
                                className="px-2.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                              >
                                <Copy className="w-3.5 h-3.5" />
                                <span>Kopyala</span>
                              </button>
                              {isSuperAdmin && !alreadyAdmin && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNewAdminHash(u.id);
                                    setNewAdminNote(u.name || u.username || '');
                                    setHashInputError(null);
                                    setActiveTab('adminAuth');
                                  }}
                                  className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                                >
                                  <Key className="w-3.5 h-3.5" />
                                  <span>Admin Yap</span>
                                </button>
                              )}
                              {alreadyAdmin && (
                                <span className="bg-blue-100 text-blue-900 border border-blue-300 px-2 py-1 rounded-full text-[10px] font-bold">
                                  Yönetici
                                </span>
                              )}
                              {bannedIds.includes(u.id) && (
                                <span className="bg-rose-100 text-rose-900 border border-rose-300 px-2 py-1 rounded-full text-[10px] font-bold">
                                  Banlı
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      )}

      {activeTab === 'reports' && (
        <ReportsPanel
          reports={reports}
          loading={reportsLoading}
          onChangeStatus={handleReportStatus}
          bannedIds={bannedIds}
          adminIds={[currentUser.userHash, ...authorizedAdminHashes]}
          onDeleteListing={handleReportDeleteListing}
          onBanUser={handleBanUser}
          onUnbanUser={handleUnbanUser}
        />
      )}

      {/* İlan denetimi */}
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
                  <th className="p-3">UniPD Doğrulama</th>
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
                        <span>{listing.isStudentCardVerified ? 'UniPD Onaylı' : 'Doğrulanmamış'}</span>
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
                        onClick={async () => {
                          if ((await onDeleteListing(listing.id)) !== false) showNotification('İlan başarıyla silindi.');
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

      {/* UniPD doğrulanmış kullanıcılar */}
      {activeTab === 'ssoLogs' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 md:p-6 space-y-4">
          <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-start gap-3">
            <div className="p-2 bg-emerald-100 rounded-xl text-emerald-800 shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="text-xs text-emerald-950 space-y-1">
              <strong className="font-bold text-sm block">
                UniPD Doğrulanmış Kullanıcılar ({verifiedUsers.length})
              </strong>
              <p className="text-emerald-800 leading-relaxed">
                Öğrencilerden <strong>hiçbir evrak talep edilmez</strong>. Rozet, kullanıcının @studenti.unipd.it / @unipd.it adresine gönderilen doğrulama linkine tıklamasıyla verilir ve veritabanı kurallarıyla korunur.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Öğrenci Adı</th>
                  <th className="p-3">Kullanıcı Adı</th>
                  <th className="p-3">Fakülte</th>
                  <th className="p-3">Doğrulama Yöntemi</th>
                  <th className="p-3">Tarih</th>
                  <th className="p-3 text-right">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {verifiedUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-stone-400">Henüz UniPD doğrulaması yapmış kullanıcı yok.</td>
                  </tr>
                )}
                {verifiedUsers.map(user => (
                  <tr key={user.id} className="hover:bg-stone-50/80 transition">
                    <td className="p-3">
                      <div className="font-bold text-stone-900">{user.name}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-mono text-stone-800">@{user.username}</div>
                    </td>
                    <td className="p-3 text-stone-600">{user.faculty}</td>
                    <td className="p-3">
                      <span className="bg-emerald-50 text-emerald-900 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-semibold">
                        UniPD e-posta doğrulaması
                      </span>
                    </td>
                    <td className="p-3 text-stone-400">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('tr-TR') : '-'}
                    </td>
                    <td className="p-3 text-right">
                      <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-bold text-[10px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>UniPD Onaylı</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Geçmiş ilanlar */}
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

      {/* Admin yetkilendirme (yalnızca ana admin) */}
      {activeTab === 'adminAuth' && isSuperAdmin && (
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
                Her kayıt olan admin olamaz. Yalnızca Ana Admin, "Kullanıcı Bul" sekmesinden bulduğu kullanıcı kimliğini (UID) buraya girerek yönetici yetkisi verebilir.
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
              <span>Yeni Yönetici Ekle (Kullanıcı Kimliği ile)</span>
            </h3>

            <form onSubmit={handleAddAdminSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-stone-700">
                    Kullanıcı Kimliği (UID) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newAdminHash}
                    onChange={(e) => setNewAdminHash(e.target.value)}
                    placeholder="Örn: 83e22ad1-d1e4-48e9-…"
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
                    placeholder="Örn: Ad Soyad - görev"
                    className="w-full min-h-[42px] px-3.5 text-xs border border-stone-300 rounded-xl bg-white text-stone-900 outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {hashInputError && (
                <p className="text-xs text-rose-600 font-semibold">{hashInputError}</p>
              )}

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-stone-500">
                  Yetki anında geçerli olur; kullanıcı sayfayı yenileyince Admin Paneli görünür.
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
                    <th className="p-3">Kullanıcı Kimliği (UID)</th>
                    <th className="p-3">Rol & Durum</th>
                    <th className="p-3">Yetki Türü</th>
                    <th className="p-3 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {authorizedAdminHashes.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-stone-400">
                        Henüz ek yönetici yok. Ana admin yetkisi e-posta adresinize tanımlıdır.
                      </td>
                    </tr>
                  )}
                  {authorizedAdminHashes.map(uid => (
                    <tr key={uid} className="hover:bg-stone-50/80 transition">
                      <td className="p-3">
                        <code className="font-mono font-bold text-stone-900 bg-stone-100 px-2 py-1 rounded border border-stone-200">
                          {uid}
                        </code>
                      </td>
                      <td className="p-3">
                        <span className="text-stone-700 font-medium">Yetkili Yönetici</span>
                      </td>
                      <td className="p-3">
                        <span className="bg-blue-100 text-blue-900 border border-blue-300 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                          Yetkili Admin
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={async () => {
                            if (!onRevokeAdminHash) return;
                            try {
                              await onRevokeAdminHash(uid);
                              showNotification('Yöneticilik yetkisi kaldırıldı.');
                            } catch {
                              showNotification('Yetki kaldırılamadı.');
                            }
                          }}
                          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer"
                        >
                          Yetkiyi Kaldır
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
