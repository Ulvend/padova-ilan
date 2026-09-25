/**
 * Returns the device's locale language code (e.g. 'tr-TR', 'it-IT', 'en-US').
 */
export function getDeviceLocale(): string {
  if (typeof navigator !== 'undefined') {
    if (navigator.language) return navigator.language;
    if (navigator.languages && navigator.languages.length > 0) return navigator.languages[0];
  }
  return 'tr-TR';
}

/**
 * Returns the device's IANA time zone identifier (e.g. 'Europe/Istanbul', 'Europe/Rome').
 */
export function getDeviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/**
 * Returns a friendly label for the user's device region & timezone
 * e.g. "TR (Europe/Istanbul)" or "IT (Europe/Rome)".
 */
export function getDeviceRegionInfo(): { locale: string; timeZone: string; label: string } {
  const locale = getDeviceLocale();
  const timeZone = getDeviceTimeZone();

  // Extract country/city if possible from timezone
  const parts = timeZone.split('/');
  const cityOrRegion = parts.length > 1 ? parts[parts.length - 1].replace(/_/g, ' ') : timeZone;

  return {
    locale,
    timeZone,
    label: `${locale.toUpperCase()} • ${cityOrRegion}`,
  };
}

/**
 * Formats a Date object or timestamp into the device's exact regional time string (e.g. "14:20" or "2:20 PM").
 */
export function formatDeviceTime(dateInput: Date | number = new Date()): string {
  const date = typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';

  try {
    const locale = getDeviceLocale();
    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    // Fallback if Intl fails
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  }
}

/**
 * Formats a date relative to device clock (Today -> local time, Yesterday -> localized "Dün / Yesterday / Ieri", etc.)
 */
export function formatDeviceRelativeDate(dateInput: Date | number, currentLang?: string): string {
  const date = typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const isSameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isSameDay) {
    return formatDeviceTime(date);
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  const lang = currentLang || getDeviceLocale().slice(0, 2).toLowerCase();

  if (isYesterday) {
    if (lang === 'tr') return `Dün ${formatDeviceTime(date)}`;
    if (lang === 'it') return `Ieri ${formatDeviceTime(date)}`;
    if (lang === 'de') return `Gestern ${formatDeviceTime(date)}`;
    if (lang === 'ru') return `Вчера ${formatDeviceTime(date)}`;
    if (lang === 'hi') return `कल ${formatDeviceTime(date)}`;
    return `Yesterday ${formatDeviceTime(date)}`;
  }

  // Format as short date in device locale
  try {
    const localeByLang: Record<string, string> = { tr: 'tr-TR', en: 'en-GB', it: 'it-IT', de: 'de-DE', ru: 'ru-RU', hi: 'hi-IN' };
    return new Intl.DateTimeFormat(currentLang ? localeByLang[currentLang] || getDeviceLocale() : getDeviceLocale(), {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return formatDeviceTime(date);
  }
}
