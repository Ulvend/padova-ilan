// Tarayıcının yerel depolamasında (localStorage) tutulan uygulama verilerini listeler ve temizler.
// Grupların anahtarları kodda kullanılanlarla aynıdır (AppContext, geocodingService, translator, viewTracking, formModel).

export type LocalDataGroupId = 'prefs' | 'favorites' | 'cache' | 'drafts' | 'views' | 'session';

interface LocalDataGroup {
  id: LocalDataGroupId;
  matches: (key: string) => boolean;
}

export const LOCAL_DATA_GROUPS: LocalDataGroup[] = [
  { id: 'prefs', matches: (k) => k === 'padova_housing_lang' },
  { id: 'favorites', matches: (k) => k === 'padova_housing_favorites_v2' },
  {
    id: 'cache',
    matches: (k) =>
      k === 'padova_housing_listings_cache_v3' || k === 'padova_geocode_cache_v2' || k.startsWith('padova_trans_v2_'),
  },
  { id: 'drafts', matches: (k) => k === 'padova_listing_wizard_draft_v1' },
  { id: 'views', matches: (k) => k === 'padova_viewed_listings_v1' },
  // Supabase oturum belirteci: temizlenirse kullanıcı çıkış yapmış olur.
  { id: 'session', matches: (k) => /^sb-.+-auth-token(-code-verifier)?$/.test(k) },
];

export interface LocalDataInfo {
  id: LocalDataGroupId;
  /** Gruptaki kayıt (anahtar) sayısı. */
  count: number;
  /** Yaklaşık boyut (bayt). */
  bytes: number;
}

const allKeys = (): string[] => {
  try {
    return Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i)).filter((k): k is string => k !== null);
  } catch {
    return [];
  }
};

/** Her grup için kayıt sayısı ve boyutu. */
export const listLocalData = (): LocalDataInfo[] => {
  const keys = allKeys();
  return LOCAL_DATA_GROUPS.map((group) => {
    const groupKeys = keys.filter(group.matches);
    const bytes = groupKeys.reduce((sum, k) => sum + k.length + (localStorage.getItem(k)?.length ?? 0), 0) * 2;
    return { id: group.id, count: groupKeys.length, bytes };
  });
};

/** Seçilen grupların tüm anahtarlarını siler. */
export const clearLocalData = (ids: LocalDataGroupId[]): void => {
  const groups = LOCAL_DATA_GROUPS.filter((g) => ids.includes(g.id));
  for (const key of allKeys()) {
    if (groups.some((g) => g.matches(key))) {
      try {
        localStorage.removeItem(key);
      } catch {
        // depolama kapalıysa yapılacak bir şey yok
      }
    }
  }
};

export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
