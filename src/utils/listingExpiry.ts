import { getListingConfirmationDays } from '../config';
import type { HousingListing, Language } from '../types';

// Otomatik arşivlenen ilanların `archiveReason` değeri (sunucudaki archive_expired_listings ile aynı).
export const EXPIRED_ARCHIVE_REASON = 'expired';

// Kiracı bulununca ilana yazılan sabit etiket (veritabanındaki eski kayıtlarla aynı Türkçe metin); gösterimde çevrilir.
export const ARCHIVED_CONFIRMATION_LABEL = 'Kiracı bulundu (Arşivlendi)';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const confirmationWindowMs = (): number => getListingConfirmationDays() * DAY_MS;

type ExpiryFields = Pick<HousingListing, 'confirmedAt' | 'createdAt' | 'isArchived'>;

/** Teyit süresinin bittiği an (ms). Teyit kaydı yoksa yayın zamanı esas alınır. */
export const confirmationDeadlineMs = (l: Pick<HousingListing, 'confirmedAt' | 'createdAt'>): number => {
  const start = Date.parse(l.confirmedAt || l.createdAt);
  return Number.isNaN(start) ? Infinity : start + confirmationWindowMs();
};

/** Yayında görünen ama teyit süresi dolmuş ilan (sunucu arşivlemeyi henüz yapmamış olabilir). */
export const isConfirmationExpired = (l: ExpiryFields, now: number = Date.now()): boolean =>
  !l.isArchived && confirmationDeadlineMs(l) <= now;

// Sıra: [tr, en, it, de, ru, hi] için [gün, saat] birim kısaltmaları.
const UNITS: Record<Language, readonly [string, string]> = {
  tr: ['g', 's'],
  en: ['d', 'h'],
  it: ['g', 'h'],
  de: ['T', 'Std.'],
  ru: ['д', 'ч'],
  hi: ['दिन', 'घं'],
};

/** Kalan süreyi "4g 6s" biçiminde yazar (1 saatin altında "<1s"). */
export const formatTimeLeft = (ms: number, lang: Language): string => {
  const [d, h] = UNITS[lang] ?? UNITS.it;
  const hours = Math.max(0, Math.ceil(ms / HOUR_MS));
  const days = Math.floor(hours / 24);
  const restHours = hours % 24;
  if (days > 0) return restHours ? `${days}${d} ${restHours}${h}` : `${days}${d}`;
  return `${Math.max(1, restHours)}${h}`;
};
