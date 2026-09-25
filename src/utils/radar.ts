import type { FilterState, ListingRadar, RadarCriteria } from '../types';
import { MAX_PRICE_UNLIMITED } from './listingFilters';

export const MAX_RADARS = 5;

export const EMPTY_CRITERIA: RadarCriteria = {
  onlyVideoTour: false,
  onlyStudentVerified: false,
  onlySubentro: false,
};

/** Ana sayfa filtrelerinden radar kriteri çıkarır (serbest metin ve sıralama radara aktarılmaz). */
export const filtersToCriteria = (f: FilterState): RadarCriteria => ({
  district: f.district !== 'all' ? f.district : undefined,
  roomType: f.roomType !== 'all' ? f.roomType : undefined,
  contractType: f.contractType !== 'all' ? f.contractType : undefined,
  minPrice: f.minPrice || undefined,
  rentalTerm: f.rentalTerm === 'all' ? undefined : f.rentalTerm,
  maxPrice: f.maxPrice < MAX_PRICE_UNLIMITED ? f.maxPrice : undefined,
  startFrom: f.contractStartFrom,
  startTo: f.contractStartFrom ? f.contractStartTo : undefined,
  maxStayMonths: f.maxStayMonths,
  gender: f.genderFilter,
  onlyVideoTour: f.onlyVideoTour,
  onlyStudentVerified: f.onlyStudentVerified,
  onlySubentro: f.onlySubentro,
});

/** Radar kriterini ana sayfa filtresine çevirir: kaç ilanın uyduğunu ortak filtre mantığıyla hesaplamak için. */
export const criteriaToFilters = (c: RadarCriteria): FilterState => ({
  searchQuery: '',
  rentalTerm: c.rentalTerm ?? 'all',
  contractType: c.contractType ?? 'all',
  district: c.district ?? 'all',
  minPrice: c.minPrice,
  maxPrice: c.maxPrice ?? MAX_PRICE_UNLIMITED,
  onlyVideoTour: c.onlyVideoTour,
  onlyStudentVerified: c.onlyStudentVerified,
  onlySubentro: c.onlySubentro,
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
      c.rentalTerm ||
      c.roomType ||
      c.contractType ||
      c.minPrice ||
      c.maxPrice ||
      c.startFrom ||
      c.maxStayMonths ||
      c.gender ||
      c.onlyVideoTour ||
      c.onlyStudentVerified ||
      c.onlySubentro
  );

export type RadarInput = RadarCriteria & { name: string };
export type { ListingRadar };
