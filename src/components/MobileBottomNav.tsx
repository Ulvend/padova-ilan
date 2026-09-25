import React from 'react';
import { Home, Map, Plus, LogIn, UserPlus, Bell } from 'lucide-react';
import { ActiveView, Language, UserProfile } from '../types';
import { CURRENT_USER } from '../data/mockData';
import { TRANSLATIONS } from '../utils/translations';

interface MobileBottomNavProps {
  currentView: ActiveView;
  onNavigateView: (view: ActiveView) => void;
  onOpenCreateModal: () => void;
  onToggleMapSection?: () => void;
  isMapOpen?: boolean;
  unreadNotificationsCount?: number;
  currentLang?: Language;
  currentUser?: UserProfile;
  isLoggedIn?: boolean;
  onOpenAuthModal?: (mode?: 'login' | 'register' | 'forgot') => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onNavigateView,
  onOpenCreateModal,
  onToggleMapSection,
  isMapOpen,
  unreadNotificationsCount = 0,
  currentLang = 'it',
  currentUser = CURRENT_USER,
  isLoggedIn = false,
  onOpenAuthModal,
}) => {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.it;

  return (
    <nav 
      aria-label={t.navAria}
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 sm:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-3 py-1 pb-safe"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        
        {/* Home / Feed */}
        <button
          type="button"
          onClick={() => onNavigateView('home')}
          className={`flex flex-col items-center justify-center min-w-[50px] min-h-[48px] py-1 px-1 rounded-xl transition active:scale-95 cursor-pointer ${
            currentView === 'home' && !isMapOpen
              ? 'text-orange-600 font-bold'
              : 'text-stone-500 hover:text-stone-900 font-medium'
          }`}
          title={t.navFeed}
        >
          <Home className={`w-5 h-5 ${currentView === 'home' && !isMapOpen ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] tracking-tight mt-0.5">{t.navFeed}</span>
        </button>

        {/* Map Toggle */}
        <button
          type="button"
          onClick={() => {
            if (currentView !== 'home') {
              onNavigateView('home');
            }
            if (onToggleMapSection) {
              onToggleMapSection();
            }
          }}
          className={`flex flex-col items-center justify-center min-w-[50px] min-h-[48px] py-1 px-1 rounded-xl transition active:scale-95 cursor-pointer relative ${
            isMapOpen && currentView === 'home'
              ? 'text-orange-600 font-bold'
              : 'text-stone-500 hover:text-stone-900 font-medium'
          }`}
          title={t.navMap}
        >
          <Map className={`w-5 h-5 ${isMapOpen && currentView === 'home' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] tracking-tight mt-0.5">{t.navMap}</span>
          {isMapOpen && currentView === 'home' && (
            <span className="w-1.5 h-1.5 rounded-full bg-orange-600 absolute top-1.5 right-3"></span>
          )}
        </button>

        {/* Central Primary Action: + İlan Ver */}
        <div className="relative -top-2 flex items-center justify-center">
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="w-11 h-11 bg-orange-600 hover:bg-orange-700 text-white rounded-full flex flex-col items-center justify-center shadow-md active:scale-95 transition cursor-pointer"
            title={t.navPost}
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span className="text-[8px] font-bold uppercase tracking-tight -mt-0.5">{t.navPost}</span>
          </button>
        </div>

        {/* AUTHENTICATED: Bildirimler & Profil */}
        {isLoggedIn ? (
          <>
            {/* Bildirimler */}
            <button
              type="button"
              onClick={() => onNavigateView('notifications')}
              className={`flex flex-col items-center justify-center min-w-[50px] min-h-[48px] py-1 px-1 rounded-xl transition active:scale-95 cursor-pointer relative ${
                currentView === 'notifications'
                  ? 'text-stone-900 font-bold'
                  : 'text-stone-500 hover:text-stone-900 font-medium'
              }`}
              title={t.notificationsNav}
            >
              <div className="relative">
                <Bell className={`w-5 h-5 ${currentView === 'notifications' ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-orange-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {unreadNotificationsCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">{t.alertsShort}</span>
            </button>

            {/* Profil / İlanlarım */}
            <button
              type="button"
              id="mobile-nav-profile-btn"
              onClick={() => onNavigateView('profile')}
              className={`flex flex-col items-center justify-center min-w-[50px] min-h-[48px] py-1 px-1 rounded-xl transition active:scale-95 cursor-pointer ${
                currentView === 'profile' || currentView === 'myListings'
                  ? 'text-orange-600 font-bold'
                  : 'text-stone-500 hover:text-stone-900 font-medium'
              }`}
              title={t.profileNav}
            >
              <div className="w-5 h-5 rounded-full overflow-hidden border border-stone-300">
                <img 
                  src={currentUser.avatar} 
                  alt={currentUser.username}
                  className="w-full h-full object-cover" 
                />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">{t.profileNav}</span>
            </button>
          </>
        ) : (
          /* GUEST / MISAFIR: Mesajlar gösterilmez, yalnızca Giriş Yap ve Kayıt Ol seçenekleri yer alır */
          <>
            <button
              type="button"
              id="mobile-nav-login-btn"
              onClick={() => onOpenAuthModal && onOpenAuthModal('login')}
              className="flex flex-col items-center justify-center min-w-[54px] min-h-[48px] py-1 px-1.5 rounded-xl transition active:scale-95 cursor-pointer text-stone-600 hover:text-orange-600 font-medium"
              title={t.loginNav}
            >
              <LogIn className="w-5 h-5 stroke-2 text-stone-600" />
              <span className="text-[10px] tracking-tight mt-0.5 font-semibold">{t.loginNav}</span>
            </button>

            <button
              type="button"
              id="mobile-nav-register-btn"
              onClick={() => onOpenAuthModal && onOpenAuthModal('register')}
              className="flex flex-col items-center justify-center min-w-[54px] min-h-[48px] py-1 px-1.5 rounded-xl transition active:scale-95 cursor-pointer text-orange-600 hover:text-orange-700 font-medium"
              title={t.registerNav}
            >
              <UserPlus className="w-5 h-5 stroke-2 text-orange-600" />
              <span className="text-[10px] tracking-tight mt-0.5 font-semibold">{t.registerNav}</span>
            </button>
          </>
        )}

      </div>
    </nav>
  );
};
