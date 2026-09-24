import { Language } from '../types';
import { TRANSLATIONS } from './translations';
import type { PriceInsight } from './districtPricing';

/** Fiyat karşılaştırmasının kullanıcının dilindeki kısa metni ("Bölge ortalamasının altında (ort. €480)"). */
export function insightText(insight: PriceInsight, lang: Language): string {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.tr;
  if (insight.status === 'unknown') return t.fairNoData;
  const template = insight.status === 'lower' ? t.fairBelow : insight.status === 'higher' ? t.fairAbove : t.fairAt;
  return template.replace('{avg}', String(insight.average));
}
