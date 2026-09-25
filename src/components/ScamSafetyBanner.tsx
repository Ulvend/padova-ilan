import React from 'react';
import { ShieldAlert } from 'lucide-react';
import type { Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';

interface ScamSafetyBannerProps {
  currentLang: Language;
  compact?: boolean;
}

/** Her sohbetin üstünde sabit duran, kapatılamayan dolandırıcılık uyarısı. */
export const ScamSafetyBanner: React.FC<ScamSafetyBannerProps> = ({ currentLang, compact = false }) => {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.it;
  return (
    <div
      role="note"
      className={`flex items-start gap-2 border-b border-amber-200 bg-amber-50 text-amber-950 ${compact ? 'px-3 py-2' : 'px-4 py-2.5'}`}
    >
      <ShieldAlert className={`shrink-0 text-amber-600 ${compact ? 'mt-0.5 h-3.5 w-3.5' : 'mt-0.5 h-4 w-4'}`} />
      <div className={compact ? 'text-[10px] leading-snug' : 'text-[11px] leading-snug sm:text-xs'}>
        <p className="font-bold">{t.scamBannerTitle}</p>
        <p className="mt-0.5 text-amber-900/90">{t.scamBannerText}</p>
      </div>
    </div>
  );
};
