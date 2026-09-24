import React, { useState } from 'react';
import { CURRENT_USER } from '../data/mockData';
import { HousingListing, Language, UserProfile } from '../types';
import { 
  ShieldCheck, 
  Heart, 
  GraduationCap, 
  CheckCircle2, 
  User, 
  Clock, 
  Star, 
  Settings, 
  Copy, 
  Check, 
  Key, 
  ShieldAlert, 
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { TRANSLATIONS } from '../utils/translations';
import { getLocalizedListing } from '../utils/listingTranslator';
import { UniPdVerificationCard } from './UniPdVerificationCard';

interface ProfileViewProps {
  favoriteListings: HousingListing[];
  onSelectListing: (listing: HousingListing) => void;
  onBackToHome: () => void;
  currentLang?: Language;
  currentUser?: UserProfile;
  isLoggedIn?: boolean;
  onOpenProfileSettings?: () => void;
  onOpenAuthModal?: (mode?: 'login' | 'register') => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  favoriteListings,
  onSelectListing,
  onBackToHome,
  currentLang = 'tr',
  currentUser = CURRENT_USER,
  isLoggedIn = false,
  onOpenProfileSettings,
  onOpenAuthModal,
}) => {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.tr;
  const [copiedHash, setCopiedHash] = useState(false);

  const handleCopyHash = () => {
    navigator.clipboard.writeText(currentUser.userHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  if (!isLoggedIn || !currentUser.username) {
    return (
      <div className="w-full space-y-5">
        <div className="p-6 md:p-8 bg-white rounded-2xl border border-stone-200 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto border border-orange-100">
            <User className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h2 className="text-xl md:text-2xl font-bold text-stone-900">
              {t.profileLoginTitle}
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
              {t.profileLoginBody}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onOpenAuthModal && onOpenAuthModal('login')}
              className="bg-stone-900 hover:bg-stone-800 text-white min-h-[44px] px-6 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-sm active:scale-98"
            >
              {t.loginBtn}
            </button>
            <button
              type="button"
              onClick={() => onOpenAuthModal && onOpenAuthModal('register')}
              className="bg-orange-600 hover:bg-orange-700 text-white min-h-[44px] px-6 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-sm active:scale-98"
            >
              {t.registerNav}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-5">
      {/* Top Banner */}
      <div className="p-5 md:p-6 bg-white rounded-2xl border border-stone-200 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <button 
            onClick={onBackToHome}
            className="text-xs font-semibold text-stone-600 hover:text-orange-600 flex items-center gap-1.5 transition cursor-pointer px-2.5 py-1.5 rounded-lg hover:bg-stone-50"
          >
            <ArrowLeft className="w-4 h-4 text-orange-600" />
            <span>{t.backToHome}</span>
          </button>

          {onOpenProfileSettings && (
            <button
              onClick={onOpenProfileSettings}
              id="btn-profile-settings-profileview"
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-xs active:scale-98"
            >
              <Settings className="w-4 h-4" />
              <span>{t.profileSettingsNav}</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 pb-5">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <img 
                src={currentUser.avatar} 
                alt={currentUser.name} 
                className="w-16 h-16 rounded-full border border-stone-200 object-cover shadow-xs" 
              />
              {onOpenProfileSettings && (
                <button
                  onClick={onOpenProfileSettings}
                  title={t.profileTabPhoto}
                  className="absolute inset-0 rounded-full bg-stone-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition cursor-pointer"
                >
                  <Settings className="w-4 h-4" />
                </button>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl md:text-2xl font-bold tracking-tight text-stone-900">
                  {currentUser.name}
                </h2>
                {currentUser.role === 'superadmin' ? (
                  <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                    <span>{t.superAdminLabel}</span>
                  </span>
                ) : currentUser.role === 'admin' ? (
                  <span className="bg-blue-100 text-blue-900 border border-blue-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                    <span>{t.authorizedAdminLabel}</span>
                  </span>
                ) : null}

                {currentUser.studentIdVerified && (
                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{t.studentCardVerified}</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <p className="text-xs text-orange-600 font-semibold">
                  @{currentUser.username} • {currentUser.faculty}
                </p>
                {onOpenProfileSettings && (
                  <button
                    onClick={onOpenProfileSettings}
                    className="text-[11px] text-stone-500 hover:text-orange-600 font-medium underline cursor-pointer"
                  >
                    {t.changeDepartment}
                  </button>
                )}
              </div>
              <p className="text-[11px] text-stone-400 mt-0.5">
                {currentUser.email}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <UniPdVerificationCard />
          </div>
        </div>

        {/* User Hash Code Card for Admin Authorization */}
        <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                {t.userIdLabel}
              </span>
            </div>
            <p className="text-[11px] text-stone-500">
              {t.adminIdHint}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <code className="px-3 py-1.5 rounded-lg bg-white border border-stone-300 font-mono text-xs font-bold text-stone-900 select-all tracking-wider shadow-2xs">
              {currentUser.userHash}
            </code>
            <button
              type="button"
              onClick={handleCopyHash}
              className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              {copiedHash ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t.copied}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{t.copyBtn}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Profile Settings Quick Management Banner */}
        {onOpenProfileSettings && (
          <div className="p-4 bg-orange-50/60 border border-orange-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 shadow-2xs">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-stone-900">
                  {t.profileSettingsTitle}
                </h4>
                <p className="text-[11px] text-stone-600">
                  {t.profileSettingsHint}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenProfileSettings}
              className="px-4 py-2 bg-white hover:bg-orange-50 text-orange-950 border border-orange-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs shrink-0"
            >
              <Settings className="w-3.5 h-3.5 text-orange-600" />
              <span>{t.openSettingsBtn}</span>
            </button>
          </div>
        )}

        {/* Compatibility Preferences Grid */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400">
            {t.algorithmPreferences}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-stone-50/60 border border-stone-150 rounded-xl">
              <span className="text-[10px] text-stone-400 block uppercase font-medium">{t.prefQuietHours}</span>
              <strong className="text-stone-900 block mt-0.5">{currentUser.compatibilityPreferences.quietHours}</strong>
            </div>
            <div className="p-3 bg-stone-50/60 border border-stone-150 rounded-xl">
              <span className="text-[10px] text-stone-400 block uppercase font-medium">{t.prefHabits}</span>
              <strong className="text-stone-900 block mt-0.5">{currentUser.compatibilityPreferences.smoking}</strong>
            </div>
            <div className="p-3 bg-stone-50/60 border border-stone-150 rounded-xl">
              <span className="text-[10px] text-stone-400 block uppercase font-medium">{t.prefStudyRhythm}</span>
              <strong className="text-stone-900 block mt-0.5">{currentUser.compatibilityPreferences.studyVibe}</strong>
            </div>
            <div className="p-3 bg-stone-50/60 border border-stone-150 rounded-xl">
              <span className="text-[10px] text-stone-400 block uppercase font-medium">{t.prefCleanliness}</span>
              <strong className="text-emerald-700 block mt-0.5">{currentUser.compatibilityPreferences.cleanlinessRating}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Saved Favorites Section */}
      <div className="p-5 md:p-6 bg-white rounded-2xl border border-stone-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <h3 className="text-sm font-bold uppercase tracking-tight text-stone-900 flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
            <span>{t.favoritedListings} ({favoriteListings.length})</span>
          </h3>
        </div>

        {favoriteListings.length === 0 ? (
          <p className="text-xs text-stone-400 italic py-3">
            {t.noFavoritesYet}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {favoriteListings.map((rawFav) => {
              const fav = getLocalizedListing(rawFav, currentLang);
              return (
                <div 
                  key={fav.id}
                  onClick={() => onSelectListing(rawFav)}
                  className="p-3.5 border border-stone-200 rounded-xl bg-stone-50/40 hover:bg-orange-50/40 hover:border-orange-200 cursor-pointer transition space-y-1.5"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-semibold bg-stone-900 text-white px-2 py-0.5 rounded-full">{fav.roomType}</span>
                    <span className="font-bold text-sm text-stone-900">€{fav.price}</span>
                  </div>
                  <h4 className="font-bold text-xs text-stone-900 line-clamp-1">{fav.title}</h4>
                  <div className="text-[11px] text-stone-500">{fav.distanceToFaculty}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
