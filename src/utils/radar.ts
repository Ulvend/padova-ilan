import type { FilterState, ListingRadar, RadarCriteria } from '../types';
import { MAX_PRICE_UNLIMITED } from './listingFilters';

export const MAX_RADARS = 5;

export const EMPTY_CRITERIA: RadarCriteria = {
  onlyVideoTour: false,
  onlyStudentVerified: false,
  roommatesOnly: false,
};

/** Ana sayfa filtrelerinden radar kriteri çıkarır (serbest metin ve sıralama radara aktarılmaz). */
export const filtersToCriteria = (f: FilterState): RadarCriteria => ({
  district: f.district !== 'all' ? f.district : undefined,
  roomType: f.roomType !== 'all' ? f.roomType : undefined,
  contractType: f.contractType !== 'all' ? f.contractType : undefined,
  minPrice: f.minPrice || undefined,
  maxPrice: f.maxPrice < MAX_PRICE_UNLIMITED ? f.maxPrice : undefined,
  startFrom: f.contractStartFrom,
  startTo: f.contractStartFrom ? f.contractStartTo : undefined,
  maxStayMonths: f.maxStayMonths,
  gender: f.genderFilter,
  onlyVideoTour: f.onlyVideoTour,
  onlyStudentVerified: f.onlyStudentVerified,
  roommatesOnly: f.categoryTab === 'roommates',
});

/** Radar kriterini ana sayfa filtresine çevirir: kaç ilanın uyduğunu ortak filtre mantığıyla hesaplamak için. */
export const criteriaToFilters = (c: RadarCriteria): FilterState => ({
  categoryTab: c.roommatesOnly ? 'roommates' : 'all',
  searchQuery: '',
  contractType: c.contractType ?? 'all',
  district: c.district ?? 'all',
  minPrice: c.minPrice,
  maxPrice: c.maxPrice ?? MAX_PRICE_UNLIMITED,
  onlyVideoTour: c.onlyVideoTour,
  onlyStudentVerified: c.onlyStudentVerified,
  roomType: c.roomType ?? 'all',
  sortBy: 'relevance',
  contractStartFrom: c.startFrom,
  contractStartTo: c.startTo,
  maxStayMonths: c.maxStayMonths,
  genderFilter: c.gender,
});

/** Hiçbir kriter seçilmemişse radar her yeni ilan için bildirim gönderir; kullanıcıyı bu konuda uyarırız. */
export const hasAnyCriterion = (c: RadarCriteria): boolean =>
  Boolean(
    c.district ||
      c.roomType ||
      c.contractType ||
      c.minPrice ||
      c.maxPrice ||
      c.startFrom ||
      c.maxStayMonths ||
      c.gender ||
      c.onlyVideoTour ||
      c.onlyStudentVerified ||
      c.roommatesOnly
  );

export type RadarInput = RadarCriteria & { name: string };
export type { ListingRadar };
