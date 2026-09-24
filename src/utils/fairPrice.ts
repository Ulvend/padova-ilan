import { HousingListing } from '../types';
import { DISTRICT_BENCHMARKS } from '../data/mockData';
import { Language } from '../types';
import { TRANSLATIONS } from './translations';

type FairPrice = Pick<HousingListing, 'fairPriceStatus' | 'fairPriceText'>;

/**
 * İlan fiyatını bölgenin oda tipine göre ortalama kirasıyla karşılaştırır.
 * Ortalamanın %5 altı "uygun", %10 üstü "rayiç üstü" sayılır.
 * Stüdyo/daire gibi karşılaştırma verisi olmayan tiplerde "ortalama" döner.
 */
export function evaluateFairPrice(
  price: number,
  district: string,
  roomType: HousingListing['roomType']
): FairPrice {
  const benchmark = DISTRICT_BENCHMARKS[district];
  const average =
    !benchmark ? undefined
    : roomType === 'Singola' ? benchmark.avgPriceSingola
    : roomType === 'Doppia' || roomType === 'Posto Letto' ? benchmark.avgPriceDoppia
    : undefined;

  if (!average || !price) {
    return { fairPriceStatus: 'average', fairPriceText: 'Bölge karşılaştırması yok' };
  }

  const ratio = price / average;
  if (ratio <= 0.95) {
    return { fairPriceStatus: 'lower', fairPriceText: `Bölge ortalamasının altında (ort. €${average})` };
  }
  if (ratio >= 1.1) {
    return { fairPriceStatus: 'higher', fairPriceText: `Bölge ortalamasının üstünde (ort. €${average})` };
  }
  return { fairPriceStatus: 'average', fairPriceText: `Bölge ortalamasında (ort. €${average})` };
}

/**
 * Kayıtlı `fairPriceText` yayın anındaki dilde saklanır; gösterimde kullanıcının diline göre yeniden üretilir.
 * Durum (`fairPriceStatus`) ve bölge ortalaması ilan verisinden okunur.
 */
export function localizedFairPriceText(
  listing: Pick<HousingListing, 'fairPriceStatus' | 'district' | 'roomType'>,
  lang: Language
): string {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.tr;
  const benchmark = DISTRICT_BENCHMARKS[listing.district];
  const average =
    !benchmark ? undefined
    : listing.roomType === 'Singola' ? benchmark.avgPriceSingola
    : listing.roomType === 'Doppia' || listing.roomType === 'Posto Letto' ? benchmark.avgPriceDoppia
    : undefined;
  if (!average) return t.fairNoData;
  const template = listing.fairPriceStatus === 'lower' ? t.fairBelow : listing.fairPriceStatus === 'higher' ? t.fairAbove : t.fairAt;
  return template.replace('{avg}', String(average));
}
