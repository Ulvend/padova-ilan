import { ConversationContact, DirectMessage } from '../types';

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
    return new Intl.DateTimeFormat(getDeviceLocale(), {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return formatDeviceTime(date);
  }
}

/**
 * Generates dynamic message timestamps anchored to the device's current clock.
 * This guarantees the user sees conversation times that reflect their current device time
 * rather than hardcoded static times from hours ago.
 */
export function initializeConversationsWithDeviceTime(
  baseConversations: ConversationContact[]
): ConversationContact[] {
  const now = Date.now();
  const ONE_MIN = 60 * 1000;
  const ONE_HOUR = 60 * ONE_MIN;
  const ONE_DAY = 24 * ONE_HOUR;

  return baseConversations.map((contact, contactIndex) => {
    // Contact 0 (active chat): recent messages within the last 30 minutes of device time
    if (contactIndex === 0) {
      const offsetM1 = now - 28 * ONE_MIN;
      const offsetM2 = now - 18 * ONE_MIN;
      const offsetM3 = now - 8 * ONE_MIN;

      const updatedMessages: DirectMessage[] = contact.messages.map((m, mIdx) => {
        let timestamp = now - (30 - mIdx * 10) * ONE_MIN;
        if (mIdx === 0) timestamp = offsetM1;
        if (mIdx === 1) timestamp = offsetM2;
        if (mIdx === 2) timestamp = offsetM3;

        return {
          ...m,
          timestamp,
          time: formatDeviceTime(new Date(timestamp)),
        };
      });

      return {
        ...contact,
        lastMessageTime: formatDeviceTime(new Date(offsetM3)),
        messages: updatedMessages,
      };
    }

    // Contact 1 (Lucas): from yesterday relative to device date
    if (contactIndex === 1) {
      const yesterdayTime = now - (18 * ONE_HOUR);
      const updatedMessages: DirectMessage[] = contact.messages.map((m, mIdx) => {
        const timestamp = yesterdayTime + mIdx * 3 * ONE_MIN;
        return {
          ...m,
          timestamp,
          time: formatDeviceRelativeDate(new Date(timestamp)),
        };
      });

      const locale = getDeviceLocale().toLowerCase();
      const lastLabel = locale.startsWith('tr') ? 'Dün' : locale.startsWith('it') ? 'Ieri' : 'Yesterday';

      return {
        ...contact,
        lastMessageTime: lastLabel,
        messages: updatedMessages,
      };
    }

    // Contact 2 (Sara): 2 days ago relative to device date
    const twoDaysAgo = now - 2 * ONE_DAY;
    const updatedMessages: DirectMessage[] = contact.messages.map((m, mIdx) => {
      const timestamp = twoDaysAgo + mIdx * 5 * ONE_MIN;
      return {
        ...m,
        timestamp,
        time: formatDeviceRelativeDate(new Date(timestamp)),
      };
    });

    const locale = getDeviceLocale().toLowerCase();
    const lastLabel = locale.startsWith('tr') ? '2 gün önce' : locale.startsWith('it') ? '2 giorni fa' : '2 days ago';

    return {
      ...contact,
      lastMessageTime: lastLabel,
      messages: updatedMessages,
    };
  });
}

/**
 * Ensures any saved conversations in localStorage also adopt the current device's local clock
 * and region formatting.
 */
export function syncSavedConversationsWithDeviceTime(
  savedConversations: ConversationContact[],
  baseConversations: ConversationContact[]
): ConversationContact[] {
  if (!savedConversations || savedConversations.length === 0) {
    return initializeConversationsWithDeviceTime(baseConversations);
  }

  // Check if saved conversations lack timestamps (e.g. legacy data)
  const hasAnyTimestamp = savedConversations.some((c) =>
    (c.messages || []).some((m) => typeof m.timestamp === 'number')
  );

  if (!hasAnyTimestamp) {
    return initializeConversationsWithDeviceTime(savedConversations);
  }

  // If timestamps exist, re-format time strings with current device locale
  return savedConversations.map((contact) => {
    const updatedMessages = (contact.messages || []).map((m) => {
      if (typeof m.timestamp === 'number') {
        return {
          ...m,
          time: formatDeviceTime(new Date(m.timestamp)),
        };
      }
      return m;
    });

    const lastMsg = updatedMessages[updatedMessages.length - 1];
    let updatedLastTime = contact.lastMessageTime;
    if (lastMsg && typeof lastMsg.timestamp === 'number') {
      updatedLastTime = formatDeviceRelativeDate(new Date(lastMsg.timestamp));
    }

    return {
      ...contact,
      lastMessageTime: updatedLastTime,
      messages: updatedMessages,
    };
  });
}

