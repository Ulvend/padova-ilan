import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  Plus,
  Globe,
  MessageSquare,
  Settings,
  KeyRound,
  LogOut,
  ChevronDown,
  Bell,
  FileText,
} from 'lucide-react';
import { ActiveView, FilterState, Language, UserProfile } from '../types';
import { CURRENT_USER } from '../data/mockData';
import { TRANSLATIONS } from '../utils/translations';
import { HOME_TEXT } from '../utils/homeText';

interface HeaderProps {
  currentView: ActiveView;
  onNavigateView: (view: ActiveView) => void;
  filters?: FilterState;
  onFilterChange?: (updates: Partial<FilterState>) => void;
  currentLang: Language;
  onLangChange: (lang: Language) => void;
  onOpenCreateModal: () => void;
  totalListingsCount?: number;
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
  currentLang,
  onLangChange,
  onOpenCreateModal,
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
  const h = HOME_TEXT[currentLang] || HOME_TEXT.tr;
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

  const navLink = (active: boolean) =>
    `relative min-h-[44px] px-2.5 xl:px-4 flex items-center gap-1.5 xl:gap-2 text-sm xl:text-[15px] whitespace-nowrap shrink-0 transition cursor-pointer border-b-[3px] ${
      active ? 'font-bold text-stone-900 border-orange-600' : 'font-semibold text-stone-600 hover:text-stone-900 border-transparent'
    }`;

  const countBadge = (n: number) =>
    n > 0 ? (
      <span className="bg-orange-600 text-white text-[11px] min-w-[20px] h-5 px-1.5 rounded-full font-bold flex items-center justify-center">
        {n}
      </span>
    ) : null;

  return (
    <header className="w-full bg-white border-b border-stone-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 h-[64px] sm:h-[72px] flex items-center justify-between gap-4">
        {/* Logo + gezinme */}
        <div className="flex items-center gap-4 xl:gap-10 min-w-0 flex-1 overflow-hidden">
          <button
            type="button"
            id="header-brand-logo"
            onClick={() => onNavigateView('home')}
            className="flex items-baseline gap-2.5 cursor-pointer select-none shrink-0"
            aria-label={t.mainHeading}
          >
            <span className="font-display font-black text-2xl sm:text-[28px] tracking-tight text-stone-900">Padova</span>
            {!isLoggedIn && <span className="hidden xl:inline text-[11px] font-bold tracking-[0.14em] uppercase text-stone-500 whitespace-nowrap">Student Housing</span>}
          </button>

          <nav id="navUserBadge" className="hidden sm:flex items-center gap-0.5 xl:gap-1 min-w-0 overflow-hidden" aria-label={h.mainMenu}>
            <button id="btn-nav-home" type="button" onClick={() => onNavigateView('home')} className={navLink(currentView === 'home')}>
              {h.navExplore}
            </button>
            {isLoggedIn && (
              <>
                <button id="btn-nav-my-listings" type="button" onClick={() => onNavigateView('myListings')} className={navLink(currentView === 'myListings')} title={t.myListingsNav} aria-label={t.myListingsNav}>
                  <FileText className="w-4 h-4 xl:hidden" />
                  <span className="hidden xl:inline">{t.myListingsNav}</span>
                  {countBadge(myListingsCount)}
                </button>
                <button id="btn-nav-messages" type="button" onClick={() => onNavigateView('messages')} className={navLink(currentView === 'messages')} title={t.messagesNav} aria-label={t.messagesNav}>
                  <MessageSquare className="w-4 h-4 xl:hidden" />
                  <span className="hidden xl:inline">{t.messagesNav}</span>
                  {countBadge(unreadMessagesCount)}
                </button>
                <button
                  id="btn-nav-notifications"
                  type="button"
                  onClick={() => onNavigateView('notifications')}
                  className={navLink(currentView === 'notifications')}
                  title={t.notificationsNavTitle}
                  aria-label={t.notificationsNav}
                >
                  <Bell className="w-4 h-4" />
                  {countBadge(unreadNotificationsCount)}
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Sağ taraf */}
        <div className="flex items-center gap-2 xl:gap-3 shrink-0">
          <div className="flex items-center border border-stone-200 hover:bg-stone-50 px-2.5 rounded-xl min-h-[44px] transition-colors" id="header-top-right-language-switcher">
            <Globe className="w-4 h-4 mr-1.5 text-stone-600 shrink-0" />
            <select
              id="langSelectorTopRight"
              value={currentLang}
              onChange={(e) => onLangChange(e.target.value as Language)}
              className="bg-transparent text-sm font-semibold text-stone-800 outline-none cursor-pointer"
              aria-label={t.langSwitcherLabel}
            >
              <option value="tr">TR</option>
              <option value="en">EN</option>
              <option value="it">IT</option>
              <option value="de">DE</option>
              <option value="ru">RU</option>
              <option value="hi">HI</option>
            </select>
          </div>

          {isLoggedIn ? (
            <div className="relative" ref={userMenuRef}>
              <button
                id="btn-nav-user-menu"
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className={`min-h-[44px] px-2.5 sm:px-3 rounded-xl flex items-center gap-2 text-sm font-semibold transition cursor-pointer border ${
                  isUserMenuOpen || currentView === 'profile' ? 'bg-stone-100 border-stone-300' : 'bg-white hover:bg-stone-50 border-stone-200'
                }`}
                aria-expanded={isUserMenuOpen}
                aria-label={t.userMenu}
              >
                <img src={currentUser.avatar} alt={currentUser.name} className="w-6 h-6 rounded-full object-cover border border-stone-300" />
                <span className="hidden 2xl:inline font-bold max-w-[140px] truncate">@{currentUser.username}</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
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
                              <span>{t.notificationsNav}</span>
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
                              <span>{t.adminPanelMenu}</span>
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
          ) : (
            <button
              type="button"
              id="btn-nav-login"
              onClick={() => onOpenAuthModal && onOpenAuthModal('login')}
              className="min-h-[44px] px-3 sm:px-4 text-[15px] font-bold text-stone-900 hover:text-orange-700 transition cursor-pointer"
            >
              {h.guestLogin}
            </button>
          )}

          {/* Ziyaretçi için "Kayıt Ol" (mobilde alt menüde zaten var) */}
          {!isLoggedIn && (
            <button
              type="button"
              id="btn-nav-register"
              onClick={() => onOpenAuthModal && onOpenAuthModal('register')}
              className="hidden sm:flex items-center min-h-[44px] px-3.5 xl:px-4 text-[15px] font-bold text-stone-900 border border-stone-300 hover:border-stone-500 hover:bg-stone-50 rounded-xl transition cursor-pointer whitespace-nowrap"
            >
              {t.registerNav}
            </button>
          )}

          <button
            id="btn-post-ad"
            type="button"
            onClick={onOpenCreateModal}
            className="hidden sm:flex bg-orange-600 hover:bg-orange-700 text-white min-h-[44px] px-3.5 xl:px-5 text-sm xl:text-[15px] font-bold items-center gap-2 rounded-xl transition active:scale-95 cursor-pointer whitespace-nowrap"
            aria-label={h.postAd}
            title={h.postAd}
          >
            <Plus className="w-[18px] h-[18px] stroke-[2.4]" />
            <span className="hidden lg:inline">{h.postAd}</span>
          </button>

          {isLoggedIn && isUserAuthorizedAdmin && (
            <button
              id="btn-nav-admin"
              type="button"
              onClick={() => onNavigateView('admin')}
              title={t.adminDeskTitle}
              aria-label="Admin"
              className={`min-h-[44px] px-3 2xl:px-4 rounded-xl border flex items-center gap-2 text-sm font-bold whitespace-nowrap transition cursor-pointer ${
                currentView === 'admin' ? 'bg-amber-600 border-amber-600 text-white' : 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-950'
              }`}
            >
              <ShieldCheck className={`w-4 h-4 ${currentView === 'admin' ? 'text-white' : 'text-amber-600'}`} />
              <span className="hidden 2xl:inline">Admin</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
