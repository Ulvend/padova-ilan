import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Trash2, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getPrivacyPolicy, PRIVACY_POLICY_UPDATED } from '../data/privacyPolicy';
import { PRIVACY_CONTROLLER } from '../config';
import { LANG_LOCALE } from '../utils/locale';
import {
  LOCAL_DATA_GROUPS,
  clearLocalData,
  formatBytes,
  listLocalData,
  type LocalDataGroupId,
  type LocalDataInfo,
} from '../utils/localData';
import { supabase } from '../lib/supabase';

// Gizlilik ve çerez politikası + tarayıcıda saklanan verilerin listelenip temizlenebildiği bölüm.
export const PrivacyPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentLang, t } = useApp();
  const { content, isFallback } = getPrivacyPolicy(currentLang);
  const [items, setItems] = useState<LocalDataInfo[]>(() => listLocalData());
  const [cleared, setCleared] = useState(false);

  // Sayfa açılınca (footer'daki "Tarayıcı verilerim" bağlantısı için) ilgili bölüme kaydır.
  useEffect(() => {
    if (window.location.hash === '#tarayici-verileri') {
      document.getElementById('tarayici-verileri')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0 });
    }
  }, []);

  const groupLabel: Record<LocalDataGroupId, string> = {
    prefs: t.localGroupPrefs,
    favorites: t.localGroupFavorites,
    cache: t.localGroupCache,
    drafts: t.localGroupDrafts,
    views: t.localGroupViews,
    session: t.localGroupSession,
  };

  const updatedLabel = new Intl.DateTimeFormat(LANG_LOCALE[currentLang], { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(PRIVACY_POLICY_UPDATED)
  );

  const clear = async (ids: LocalDataGroupId[]) => {
    // Oturum temizlenecekse önce sunucuya çıkış bildirilir; yerel belirteç zaten silinir.
    if (ids.includes('session')) {
      await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
    }
    clearLocalData(ids);
    setItems(listLocalData());
    setCleared(true);
    // Uygulamanın bellekteki durumu (oturum, favoriler…) temizlenen depolamayla eşleşsin.
    if (ids.includes('session') || ids.length === LOCAL_DATA_GROUPS.length) {
      setTimeout(() => window.location.assign('/'), 600);
    }
  };

  const totalItems = items.reduce((sum, i) => sum + i.count, 0);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        type="button"
        onClick={() => navigate('/')}
        className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 transition cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>{t.backToHome}</span>
      </button>

      <article className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 md:p-8 space-y-6">
        <header className="space-y-2 border-b border-stone-100 pb-5">
          <div className="flex items-center gap-2 text-emerald-700">
            <ShieldCheck className="w-5 h-5" />
            <h1 className="font-display font-black text-2xl md:text-3xl text-stone-900 tracking-tight">{content.title}</h1>
          </div>
          <p className="text-xs text-stone-400">
            {content.updated}: {updatedLabel}
          </p>
          {isFallback && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{t.privacyFallbackNote}</p>}
          <p className="text-sm text-stone-600 leading-relaxed pt-1">{content.intro}</p>
        </header>

        {(PRIVACY_CONTROLLER.name || PRIVACY_CONTROLLER.email) && (
          <section className="text-sm text-stone-700 space-y-1">
            {PRIVACY_CONTROLLER.name && (
              <p>
                <strong>{t.privacyController}:</strong> {PRIVACY_CONTROLLER.name}
              </p>
            )}
            {PRIVACY_CONTROLLER.email && (
              <p>
                <strong>{t.privacyContact}:</strong>{' '}
                <a className="text-orange-700 underline" href={`mailto:${PRIVACY_CONTROLLER.email}`}>
                  {PRIVACY_CONTROLLER.email}
                </a>
              </p>
            )}
          </section>
        )}

        {content.sections.map((section) => (
          <section key={section.heading} className="space-y-2">
            <h2 className="text-base font-bold text-stone-900">{section.heading}</h2>
            {section.paragraphs?.map((p) => (
              <p key={p} className="text-sm text-stone-600 leading-relaxed">
                {p}
              </p>
            ))}
            {section.bullets && (
              <ul className="list-disc pl-5 space-y-1.5 text-sm text-stone-600 leading-relaxed">
                {section.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            )}
          </section>
        ))}

        {/* Tarayıcıda saklanan veriler */}
        <section id="tarayici-verileri" className="scroll-mt-24 space-y-3 border-t border-stone-100 pt-6">
          <h2 className="text-base font-bold text-stone-900">{t.localDataTitle}</h2>
          <p className="text-sm text-stone-600 leading-relaxed">{t.localDataIntro}</p>

          <ul className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden">
            {LOCAL_DATA_GROUPS.map((group) => {
              const info = items.find((i) => i.id === group.id);
              const empty = !info || info.count === 0;
              return (
                <li key={group.id} className="flex items-center justify-between gap-3 px-4 py-3 bg-white">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-stone-800 text-balance">{groupLabel[group.id]}</p>
                    <p className="text-[11px] text-stone-400">
                      {empty ? t.localDataEmpty : `${t.localDataItems.replace('{n}', String(info.count))} · ${formatBytes(info.bytes)}`}
                    </p>
                    {group.id === 'session' && !empty && <p className="text-[11px] text-amber-700">{t.localDataSessionNote}</p>}
                  </div>
                  <button
                    type="button"
                    disabled={empty}
                    onClick={() => clear([group.id])}
                    className="shrink-0 px-3 py-1.5 text-xs font-bold rounded-lg border border-stone-300 bg-white hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-stone-300 disabled:hover:text-inherit disabled:cursor-not-allowed cursor-pointer transition"
                  >
                    {t.localDataClear}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="flex flex-wrap items-center justify-between gap-3">
            {cleared ? (
              <span role="status" className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                <Check className="w-4 h-4" />
                {t.localDataCleared}
              </span>
            ) : (
              <span />
            )}
            <button
              type="button"
              disabled={totalItems === 0}
              onClick={() => clear(LOCAL_DATA_GROUPS.map((g) => g.id))}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white cursor-pointer transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {t.localDataClearAll}
            </button>
          </div>
        </section>
      </article>
    </div>
  );
};
