import type { FilterState, HousingListing } from '../types';
import { availableFromISO, stayMonths } from './contractPeriod';

// "Sınırsız" fiyat sınırı: kaydırıcı en sağdayken fiyat filtresi uygulanmaz.
export const MAX_PRICE_UNLIMITED = 900;

/**
 * Serbest metin araması dışındaki tüm filtreler. Ana sayfa listesi ve İlan Radarı aynı kuralları kullanır;
 * sunucudaki eşleştirme (0026_listing_radar.sql, notify_listing_radars) bunun SQL karşılığıdır.
 */
export const matchesListingFilters = (l: HousingListing, filters: FilterState, todayIso: string): boolean => {
  if (filters.categoryTab === 'roommates' && !((l.currentFlatmates?.length || 0) > 0 || (l.totalHousemates || 0) > 1)) return false;
  if (filters.district !== 'all' && l.district !== filters.district) return false;
  if (filters.contractType !== 'all' && l.contractType !== filters.contractType) return false;
  if (filters.roomType !== 'all' && l.roomType !== filters.roomType) return false;
  if (filters.minPrice && l.price < filters.minPrice) return false;
  if (filters.maxPrice < MAX_PRICE_UNLIMITED && l.price > filters.maxPrice) return false;
  if (filters.onlyVideoTour && !l.hasVideoTour) return false;
  if (filters.onlyStudentVerified && !l.isStudentCardVerified) return false;

  const availableFrom = availableFromISO(l, todayIso);
  if (filters.contractStartFrom && availableFrom < filters.contractStartFrom) return false;
  if (filters.contractStartTo && availableFrom > filters.contractStartTo) return false;
  if (filters.genderFilter === 'female' && l.genderPreference === 'male_only') return false;
  if (filters.genderFilter === 'male' && l.genderPreference === 'female_only') return false;
  if (filters.maxStayMonths) {
    const months = stayMonths(l, todayIso);
    if (months === null || months > filters.maxStayMonths) return false;
  }
  return true;
};
