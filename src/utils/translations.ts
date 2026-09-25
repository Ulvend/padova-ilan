import type { Language } from '../types';
import type { FullDictionary } from '../i18n/source';
import italian from 'virtual:i18n/it';

export type { FullDictionary, TranslationDictionary } from '../i18n/source';

// İtalyanca (sitenin ana dili, varsayılan) pakete dahildir. Diğer diller, kullanıcı seçtiğinde ayrı parça olarak indirilir;
// yüklenene kadar (ve yükleme başarısız olursa) İtalyanca döner. Kaynak: src/i18n/source.ts
const dictionaries: Partial<Record<Language, FullDictionary>> = { it: italian };

const loaders: Record<Exclude<Language, 'it'>, () => Promise<{ default: FullDictionary }>> = {
  tr: () => import('virtual:i18n/tr'),
  en: () => import('virtual:i18n/en'),
  de: () => import('virtual:i18n/de'),
  ru: () => import('virtual:i18n/ru'),
  hi: () => import('virtual:i18n/hi'),
};

export const TRANSLATIONS = new Proxy({} as Record<Language, FullDictionary>, {
  get: (_target, lang) => (typeof lang === 'string' ? dictionaries[lang as Language] ?? dictionaries.it : undefined),
});

/** Dil sözlüğünü indirir (zaten yüklüyse hemen döner). Dil değiştirmeden önce çağrılmalıdır. */
export async function loadLanguage(lang: Language): Promise<void> {
  if (dictionaries[lang] || lang === 'it') return;
  const mod = await loaders[lang]();
  dictionaries[lang] = mod.default;
}
