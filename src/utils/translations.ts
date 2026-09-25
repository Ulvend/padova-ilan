import type { Language } from '../types';
import type { FullDictionary } from '../i18n/source';
import turkish from 'virtual:i18n/tr';

export type { FullDictionary, TranslationDictionary } from '../i18n/source';

// Türkçe (varsayılan dil) pakete dahildir. Diğer diller, kullanıcı seçtiğinde ayrı parça olarak indirilir;
// yüklenene kadar (ve yükleme başarısız olursa) Türkçe döner. Kaynak: src/i18n/source.ts
const dictionaries: Partial<Record<Language, FullDictionary>> = { tr: turkish };

const loaders: Record<Exclude<Language, 'tr'>, () => Promise<{ default: FullDictionary }>> = {
  en: () => import('virtual:i18n/en'),
  it: () => import('virtual:i18n/it'),
  de: () => import('virtual:i18n/de'),
  ru: () => import('virtual:i18n/ru'),
  hi: () => import('virtual:i18n/hi'),
};

export const TRANSLATIONS = new Proxy({} as Record<Language, FullDictionary>, {
  get: (_target, lang) => (typeof lang === 'string' ? dictionaries[lang as Language] ?? dictionaries.tr : undefined),
});

/** Dil sözlüğünü indirir (zaten yüklüyse hemen döner). Dil değiştirmeden önce çağrılmalıdır. */
export async function loadLanguage(lang: Language): Promise<void> {
  if (dictionaries[lang] || lang === 'tr') return;
  const mod = await loaders[lang]();
  dictionaries[lang] = mod.default;
}
