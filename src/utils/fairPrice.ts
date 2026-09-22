import { HousingListing } from '../types';
import { DISTRICT_BENCHMARKS } from '../data/mockData';

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
