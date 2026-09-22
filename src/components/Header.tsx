import React, { useState, useRef, useEffect } from 'react';
import { 
  ShieldCheck, 
  Video, 
  FileText, 
  Users, 
  Plus, 
  Globe, 
  Scale, 
  Flame, 
  CheckCircle2, 
  Building2, 
  Sparkles,
  MessageSquare,
  Home,
  Search,
  Settings,
  KeyRound,
  LogIn,
  LogOut,
  ChevronDown,
  UserPlus,
  RefreshCw,
  Bell
} from 'lucide-react';
import { ActiveView, FilterState, Language, UserProfile } from '../types';
import { CURRENT_USER, PADOVA_STATS } from '../data/mockData';
import { TRANSLATIONS } from '../utils/translations';

interface HeaderProps {
  currentView: ActiveView;
  onNavigateView: (view: ActiveView) => void;
  filters: FilterState;
  onFilterChange: (updates: Partial<FilterState>) => void;
  currentLang: Language;
  onLangChange: (lang: Language) => void;
  onOpenCreateModal: () => void;
  totalListingsCount: number;
  unreadMessagesCount: number;
  unreadNotificationsCount?: number;
  myListingsCount?: number;
  currentUser?: UserProfile;
  isAdmin?: boolean;
  onOpenProfileSettings?: () => void;
  onOpenAuthModal?: (mode?: 'login' | 'register' | 'forgot') => void;
  isLoggedIn?: boolean;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigateView,
  filters,
  onFilterChange,
  currentLang,
  onLangChange,
  onOpenCreateModal,
  totalListingsCount,
  unreadMessagesCount,
  unreadNotificationsCount = 0,
  myListingsCount = 0,
  currentUser = CURRENT_USER,
  isAdmin = false,
  onOpenProfileSettings,
  onOpenAuthModal,
  isLoggedIn = false,
  onLogout,
}) => {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.tr;
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Admin durumu AppContext'ten gelir (ana admin e-postası veya Firestore'daki admins kaydı)
  const isUserAuthorizedAdmin = isAdmin;

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="w-full space-y-4">
      {/* Top Banner Box with Refined Air and Modern Simplicity */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 sm:p-6 md:p-7">
        
        {/* TOPMOST UTILITY BAR: TOP-RIGHT CORNER LANGUAGE SWITCHER */}
        <div className="flex items-center justify-end gap-3 pb-3 border-b border-stone-100 mb-4 text-xs">
          {/* DEDICATED TOP-RIGHT LANGUAGE SWITCHER (DİL SEÇİCİ - SAĞ ÜST KÖŞE) */}
          <div className="flex items-center gap-2" id="header-top-right-language-switcher">
            <div className="flex items-center border border-stone-200 bg-stone-50 hover:bg-stone-100 px-3 py-1.5 rounded-xl min-h-[38px] transition-colors shadow-2xs">
              <Globe className="w-4 h-4 mr-2 text-stone-600 shrink-0" />
              <select 
                id="langSelectorTopRight" 
                value={currentLang}
                onChange={(e) => onLangChange(e.target.value as Language)}
                className="bg-transparent text-xs sm:text-sm font-bold text-stone-800 outline-none cursor-pointer pr-1"
                aria-label="Language Switcher"
              >
                <option value="tr">TR (Türkçe)</option>
                <option value="en">EN (English)</option>
                <option value="it">IT (Italiano)</option>
                <option value="de">DE (Deutsch)</option>
                <option value="ru">RU (Русский)</option>
                <option value="hi">HI (हिन्दी)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 pb-5">
          
          {/* Logo & Headline */}
          <div 
            className="cursor-pointer group select-none" 
            onClick={() => onNavigateView('home')}
            id="header-brand-logo"
          >
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-stone-900 group-hover:text-orange-600 transition-colors">
              {t.mainHeading}
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-xl leading-relaxed">
              {t.tagline}
            </p>
          </div>

          {/* Controls: Desktop Navigation Buttons + User Menu */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            
            {/* Desktop Navigation Badges */}
            <div id="navUserBadge" className="hidden sm:flex items-center gap-2">
              
              {/* Anasayfa Button */}
              <button 
                id="btn-nav-home"
                onClick={() => onNavigateView('home')} 
                className={`min-h-[42px] px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-2 transition cursor-pointer border ${
                  currentView === 'home' 
                    ? 'bg-stone-900 text-white border-stone-900 shadow-sm' 
                    : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-200'
                }`}
                title="İlan arama ve radar ekranı"
              >
                <Search className="w-4 h-4" />
                <span>{t.homeNav}</span>
              </button>

              {/* AUTHENTICATED STATE: SHOW MY LISTINGS, MESSAGES, AVATAR & DROPDOWN */}
              {isLoggedIn ? (
                <>
                  {/* My Listings Button */}
                  <button 
                    id="btn-nav-my-listings"
                    onClick={() => onNavigateView('myListings')} 
                    className={`min-h-[42px] px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-2 transition cursor-pointer border ${
                      currentView === 'myListings' 
                        ? 'bg-orange-600 text-white border-orange-600 shadow-sm' 
                        : 'bg-stone-50 hover:bg-stone-100 text-stone-800 border-stone-200'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>{t.myListingsNav}</span>
                    {myListingsCount > 0 && (
                      <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                        {myListingsCount}
                      </span>
                    )}
                  </button>

                  {/* Mesajlar Button */}
                  <button 
                    id="btn-nav-messages"
                    onClick={() => onNavigateView('messages')} 
                    className={`min-h-[42px] px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-2 transition cursor-pointer border ${
                      currentView === 'messages' 
                        ? 'bg-purple-700 text-white border-purple-700 shadow-sm' 
                        : 'bg-stone-50 hover:bg-stone-100 text-stone-800 border-stone-200'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{t.messagesNav}</span>
                    {unreadMessagesCount > 0 && (
                      <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                        {unreadMessagesCount}
                      </span>
                    )}
                  </button>

                  {/* Bildirimler Sekmesi (Kullanıcıya Özel Bildirimler) */}
                  <button 
                    id="btn-nav-notifications"
                    onClick={() => onNavigateView('notifications')} 
                    className={`min-h-[42px] px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-2 transition cursor-pointer border ${
                      currentView === 'notifications' 
                        ? 'bg-stone-900 text-white border-stone-900 shadow-sm' 
                        : 'bg-stone-50 hover:bg-stone-100 text-stone-800 border-stone-200'
                    }`}
                    title="Kullanıcı Bildirimleri"
                  >
                    <Bell className="w-4 h-4 text-stone-600" />
                    <span className="hidden md:inline">Bildirimler</span>
                    {unreadNotificationsCount > 0 && (
                      <span className="bg-orange-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold animate-pulse">
                        {unreadNotificationsCount}
                      </span>
                    )}
                  </button>

                  {/* Admin Panel Button (ONLY visible to authorized admins) */}
                  {isUserAuthorizedAdmin && (
                    <button 
                      id="btn-nav-admin"
                      onClick={() => onNavigateView('admin')} 
                      className={`min-h-[42px] px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-2 transition cursor-pointer border ${
                        currentView === 'admin' 
                          ? 'bg-amber-600 text-white border-amber-600 shadow-sm' 
                          : 'bg-amber-50 hover:bg-amber-100 text-amber-950 border-amber-200'
                      }`}
                      title="UniPD Konut & Güvenlik Yönetim Masası"
                    >
                      <ShieldCheck className="w-4 h-4 text-amber-600" />
                      <span className="font-bold">Admin</span>
                    </button>
                  )}

                  {/* USER MENU BUTTON & DROPDOWN (KULLANICI MENÜSÜ & PROFİL AYARLARI) */}
                  <div className="relative" ref={userMenuRef}>
                    <button 
                      id="btn-nav-user-menu"
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} 
                      className={`min-h-[42px] px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-2 transition cursor-pointer border ${
                        isUserMenuOpen || currentView === 'profile'
                          ? 'bg-amber-100 text-amber-950 border-amber-300 shadow-sm' 
                          : 'bg-stone-50 hover:bg-stone-100 text-stone-800 border-stone-200'
                      }`}
                      aria-expanded={isUserMenuOpen}
                      aria-label={t.userMenu}
                    >
                      <img 
                        src={currentUser.avatar} 
                        alt={currentUser.name} 
                        className="w-5 h-5 rounded-full object-cover border border-stone-300" 
                      />
                      <span className="font-bold">@{currentUser.username}</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* DROPDOWN MENU */}
                    {isUserMenuOpen && (
                      <div 
                        id="user-menu-dropdown"
                        className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-stone-200 shadow-xl py-2 z-40 animate-in fade-in zoom-in-95 duration-150"
                      >
                        {/* User info strip */}
                        <div className="px-4 py-3 border-b border-stone-100">
                          <div className="flex items-center gap-2.5">
                            <img 
                              src={currentUser.avatar} 
                              alt={currentUser.name} 
                              className="w-9 h-9 rounded-full object-cover border border-orange-400" 
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-stone-900 truncate">{currentUser.name}</p>
                              <p className="text-[11px] text-orange-600 font-semibold truncate">@{currentUser.username}</p>
                              <p className="text-[10px] text-stone-400 truncate">{currentUser.email}</p>
                            </div>
                          </div>
                        </div>

                        {/* Menu items */}
                        <div className="py-1 text-xs font-medium">
                          
                          {/* Profil Ayarları Modal Trigger */}
                          <button
                            type="button"
                            id="menu-item-profile-settings"
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              if (onOpenProfileSettings) onOpenProfileSettings();
                            }}
                            className="w-full text-left px-4 py-2.5 text-stone-700 hover:bg-orange-50 hover:text-orange-950 flex items-center gap-2.5 cursor-pointer transition"
                          >
                            <Settings className="w-4 h-4 text-orange-600" />
                            <span className="font-semibold">{t.profileSettingsNav}</span>
                          </button>

                          {/* Profil Sayfası */}
                          <button
                            type="button"
                            id="menu-item-profile-view"
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              onNavigateView('profile');
                            }}
                            className="w-full text-left px-4 py-2.5 text-stone-700 hover:bg-stone-50 flex items-center gap-2.5 cursor-pointer transition"
                          >
                            <Users className="w-4 h-4 text-stone-500" />
                            <span>{t.profileNav}</span>
                          </button>

                          {/* Kullanıcıya Özel Bildirimler */}
                          <button
                            type="button"
                            id="menu-item-notifications-view"
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              onNavigateView('notifications');
                            }}
                            className="w-full text-left px-4 py-2.5 text-stone-700 hover:bg-stone-50 flex items-center justify-between cursor-pointer transition"
                          >
                            <div className="flex items-center gap-2.5">
                              <Bell className="w-4 h-4 text-stone-500" />
                              <span>Bildirimler</span>
                            </div>
                            {unreadNotificationsCount > 0 && (
                              <span className="bg-orange-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                                {unreadNotificationsCount}
                              </span>
                            )}
                          </button>

                          {/* Yönetici / Admin Paneli (Only for authorized admins) */}
                          {isUserAuthorizedAdmin && (
                            <button
                              type="button"
                              id="menu-item-admin-view"
                              onClick={() => {
                                setIsUserMenuOpen(false);
                                onNavigateView('admin');
                              }}
                              className="w-full text-left px-4 py-2.5 text-amber-900 bg-amber-50/70 hover:bg-amber-100 flex items-center gap-2.5 cursor-pointer transition font-bold"
                            >
                              <ShieldCheck className="w-4 h-4 text-amber-600" />
                              <span>Yönetici Paneli (Admin)</span>
                            </button>
                          )}

                          {/* Şifremi Unuttum Akışı Trigger */}
                          <button
                            type="button"
                            id="menu-item-forgot-password"
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              if (onOpenAuthModal) onOpenAuthModal('forgot');
                            }}
                            className="w-full text-left px-4 py-2.5 text-stone-700 hover:bg-stone-50 flex items-center gap-2.5 cursor-pointer transition"
                          >
                            <KeyRound className="w-4 h-4 text-amber-600" />
                            <span>{t.forgotPasswordNav}</span>
                          </button>

                          {/* Çıkış İşlemi (Logout) */}
                          <div className="border-t border-stone-100 my-1 pt-1">
                            <button
                              type="button"
                              id="menu-item-auth-logout"
                              onClick={() => {
                                setIsUserMenuOpen(false);
                                if (onLogout) onLogout();
                              }}
                              className="w-full text-left px-4 py-2.5 text-rose-600 hover:bg-rose-50 hover:text-rose-700 flex items-center gap-2.5 cursor-pointer transition font-semibold"
                            >
                              <LogOut className="w-4 h-4 text-rose-500" />
                              <span>{t.logoutNav}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* GUEST / MISAFIR STATE: ONLY GİRİŞ YAP VE KAYIT OL */
                <div id="guest-auth-controls" className="flex items-center gap-2">
                  <button
                    type="button"
                    id="btn-nav-login"
                    onClick={() => onOpenAuthModal && onOpenAuthModal('login')}
                    className="min-h-[42px] px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-2 bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 transition cursor-pointer shadow-2xs"
                  >
                    <LogIn className="w-4 h-4 text-stone-600" />
                    <span>{t.loginNav}</span>
                  </button>

                  <button
                    type="button"
                    id="btn-nav-register"
                    onClick={() => onOpenAuthModal && onOpenAuthModal('register')}
                    className="min-h-[42px] px-4 py-1.5 text-xs font-bold rounded-lg flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white transition cursor-pointer shadow-xs"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{t.registerNav}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile View Top Header Buttons */}
            <div className="flex sm:hidden items-center gap-2">
              {isLoggedIn ? (
                <button
                  type="button"
                  id="mobile-header-user-btn"
                  onClick={() => onNavigateView('profile')}
                  className="min-h-[40px] px-2.5 py-1 rounded-lg border border-stone-200 bg-white flex items-center gap-1.5 text-xs font-bold text-stone-800"
                >
                  <img 
                    src={currentUser.avatar} 
                    alt={currentUser.name} 
                    className="w-5 h-5 rounded-full object-cover border border-orange-400" 
                  />
                  <span>@{currentUser.username}</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    id="mobile-header-login-btn"
                    onClick={() => onOpenAuthModal && onOpenAuthModal('login')}
                    className="min-h-[38px] px-2.5 py-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-xs font-bold text-stone-700 flex items-center gap-1 cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5 text-stone-500" />
                    <span>{t.loginNav}</span>
                  </button>
                  <button
                    type="button"
                    id="mobile-header-register-btn"
                    onClick={() => onOpenAuthModal && onOpenAuthModal('register')}
                    className="min-h-[38px] px-2.5 py-1 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{t.registerNav}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Post New Ad Button (Desktop & Tablet) */}
            <button 
              id="btn-post-ad"
              onClick={onOpenCreateModal}
              className="hidden sm:flex bg-orange-600 hover:bg-orange-500 text-white min-h-[42px] px-4 py-1.5 text-xs font-bold uppercase tracking-wider items-center gap-2 rounded-lg shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>{t.postAdBtn}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Fair Price Radar Alert Bar with Reference Market Price */}
      <div className="border border-emerald-200/80 bg-emerald-50/80 p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between text-xs sm:text-sm gap-3">
        <div className="flex items-center gap-3">
          <Scale className="w-5 h-5 text-emerald-700 shrink-0" />
          <span className="leading-relaxed text-emerald-950">
            <strong>{t.fairPriceBannerTitle}</strong> {t.fairPriceBannerText}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <span className="bg-white border border-emerald-200 text-emerald-900 px-2.5 py-1 text-xs font-bold rounded-md shadow-xs whitespace-nowrap">
            {t.statAveragePrice}: {PADOVA_STATS.averageSingolaPrice}
          </span>
          <span className="bg-emerald-700 text-white px-2.5 py-1 text-[11px] font-semibold uppercase rounded-md whitespace-nowrap">
            {t.fairPriceRadarTag}
          </span>
        </div>
      </div>

      {/* Quick Filter Tabs */}
      {currentView === 'home' && (
        <div className="flex items-center gap-2 text-xs font-semibold overflow-x-auto py-0.5 no-scrollbar">
          <button 
            id="tab-all"
            onClick={() => onFilterChange({ categoryTab: 'all' })}
            className={`min-h-[40px] px-4 py-2 rounded-xl transition shrink-0 cursor-pointer border ${
              filters.categoryTab === 'all' 
                ? 'bg-stone-900 text-white border-stone-900 shadow-sm' 
                : 'bg-white text-stone-700 hover:bg-stone-50 border-stone-200 shadow-xs'
            }`}
          >
            {t.tabAll} ({totalListingsCount})
          </button>
          
          <button 
            id="tab-newest"
            onClick={() => onFilterChange({ categoryTab: 'newest', sortBy: 'newest' })}
            className={`min-h-[40px] px-4 py-2 rounded-xl transition shrink-0 cursor-pointer border flex items-center gap-1.5 ${
              filters.categoryTab === 'newest' 
                ? 'bg-orange-600 text-white border-orange-600 shadow-sm font-bold' 
                : 'bg-white text-stone-700 hover:bg-stone-50 border-stone-200 shadow-xs'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${filters.categoryTab === 'newest' ? 'text-amber-200' : 'text-orange-500'}`} />
            <span>{t.tabNewest}</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              filters.categoryTab === 'newest' ? 'bg-orange-800 text-white' : 'bg-orange-100 text-orange-800'
            }`}>
              {t.recentlyAddedBadge}
            </span>
          </button>
          
          <button 
            id="tab-video"
            onClick={() => onFilterChange({ categoryTab: 'video' })}
            className={`min-h-[40px] px-4 py-2 rounded-xl transition shrink-0 cursor-pointer border flex items-center gap-2 ${
              filters.categoryTab === 'video' 
                ? 'bg-purple-700 text-white border-purple-700 shadow-sm' 
                : 'bg-white text-stone-700 hover:bg-stone-50 border-stone-200 shadow-xs'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>{t.tabVideo}</span>
          </button>

          <button 
            id="tab-transitorio"
            onClick={() => onFilterChange({ categoryTab: 'transitorio' })}
            className={`min-h-[40px] px-4 py-2 rounded-xl transition shrink-0 cursor-pointer border flex items-center gap-2 ${
              filters.categoryTab === 'transitorio' 
                ? 'bg-stone-900 text-white border-stone-900 shadow-sm' 
                : 'bg-white text-stone-700 hover:bg-stone-50 border-stone-200 shadow-xs'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{t.tabTransitorio}</span>
          </button>

          <button 
            id="tab-subentro"
            onClick={() => onFilterChange({ categoryTab: 'subentro' })}
            className={`min-h-[40px] px-4 py-2 rounded-xl transition shrink-0 cursor-pointer border flex items-center gap-2 ${
              filters.categoryTab === 'subentro' 
                ? 'bg-stone-900 text-white border-stone-900 shadow-sm' 
                : 'bg-white text-stone-700 hover:bg-stone-50 border-stone-200 shadow-xs'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t.tabSubentro}</span>
          </button>

          <button 
            id="tab-roommates"
            onClick={() => onFilterChange({ categoryTab: 'roommates' })}
            className={`min-h-[40px] px-4 py-2 rounded-xl transition shrink-0 cursor-pointer border flex items-center gap-2 ${
              filters.categoryTab === 'roommates' 
                ? 'bg-stone-900 text-white border-stone-900 shadow-sm' 
                : 'bg-white text-stone-700 hover:bg-stone-50 border-stone-200 shadow-xs'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{t.tabRoommates}</span>
          </button>
        </div>
      )}
    </header>
  );
};
