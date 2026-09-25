import type { HousingListing } from '../types';
import { fromISO, monthsBetween } from '../components/ui/DateRangePicker';

// Kısa dönem: 1–6 aylık kalışlar (ör. Erasmus). Uzun dönem: 6 aydan uzun.
// 30 gün ve daha kısa kalışlar sitede hiç yayınlanmaz (turistik kiralama / CIN kapsamına girer); bu yüzden alt sınır 31 gündür.
// Sunucudaki karşılığı: 0029_min_stay_and_rental_term.sql (notify_listing_radars ve süre kısıtı).
export type RentalTerm = 'long' | 'short';

export const SHORT_TERM_MAX_MONTHS = 6;
export const MIN_STAY_DAYS = 31;

/** İki ISO tarih arasındaki gün sayısı; geçersizse null. */
export const stayDays = (startISO: string, endISO: string): number | null => {
  const a = fromISO(startISO);
  const b = fromISO(endISO);
  if (!a || !b) return null;
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
};

/** Müsaitlik aralığının uzunluğuna göre sekme: en fazla 6 ay kısa dönem, aksi halde uzun dönem. */
export const termFromDates = (startISO?: string, endISO?: string): RentalTerm => {
  const months = startISO && endISO ? monthsBetween(startISO, endISO) : null;
  return months !== null && months <= SHORT_TERM_MAX_MONTHS ? 'short' : 'long';
};

export const rentalTermOf = (l: Pick<HousingListing, 'contractStartISO' | 'contractEndISO'>): RentalTerm =>
  termFromDates(l.contractStartISO, l.contractEndISO);
