// Aynı tarayıcıdan aynı ilan için görüntülenme 24 saatte bir sayılır (yenileme ve sayfa gezintisiyle şişmesin).
const STORAGE_KEY = 'padova_viewed_listings_v1';
const WINDOW_MS = 24 * 60 * 60 * 1000;

const read = (): Record<string, number> => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

/** Bu ilan son 24 saatte bu tarayıcıdan sayılmadıysa true döner ve şimdiyi kaydeder. */
export const shouldCountView = (listingId: string): boolean => {
  const now = Date.now();
  const seen = read();
  if (seen[listingId] && now - seen[listingId] < WINDOW_MS) return false;
  // Süresi dolan kayıtlar temizlenir; depolama sınırsız büyümesin.
  const fresh = Object.fromEntries(Object.entries(seen).filter(([, ts]) => now - ts < WINDOW_MS));
  fresh[listingId] = now;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  } catch {
    // Depolama kapalıysa (gizli mod) yine de sayılır.
  }
  return true;
};
