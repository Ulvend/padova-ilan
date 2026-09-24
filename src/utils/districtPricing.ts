import type { HousingListing, RoomType } from '../types';

// Bir karşılaştırmanın anlamlı sayılması için aynı bölge ve oda tipinde gereken en az "diğer" ilan sayısı.
export const MIN_COMPARABLE_LISTINGS = 3;

// Ortalamanın %95'i ve altı "uygun", %110'u ve üstü "yüksek" sayılır.
export const LOW_RATIO = 0.95;
export const HIGH_RATIO = 1.1;

export type PriceStatus = 'lower' | 'average' | 'higher' | 'unknown';

export interface PriceInsight {
  status: PriceStatus;
  /** Karşılaştırılan diğer ilanların ortalama kirası (unknown ise 0). */
  average: number;
  /** Ortalamaya giren diğer ilan sayısı. */
  count: number;
  /** İlan fiyatının ortalamadan yüzde sapması (mutlak değer, yuvarlanmış). */
  percentDiff: number;
}

export interface PriceTarget {
  id?: string;
  district: string;
  roomType: RoomType | string;
  price: number;
}

interface Group {
  sum: number;
  count: number;
  prices: Map<string, number>;
}

const UNKNOWN: PriceInsight = { status: 'unknown', average: 0, count: 0, percentDiff: 0 };

const insightFrom = (price: number, sum: number, count: number): PriceInsight => {
  if (count < MIN_COMPARABLE_LISTINGS || !(price > 0)) return { ...UNKNOWN, count };
  const average = Math.round(sum / count);
  const ratio = price / (sum / count);
  const status: PriceStatus = ratio <= LOW_RATIO ? 'lower' : ratio >= HIGH_RATIO ? 'higher' : 'average';
  return { status, average, count, percentDiff: Math.round(Math.abs(ratio - 1) * 100) };
};

export interface PriceIndex {
  /** İlanı, aynı bölge ve oda tipindeki DİĞER ilanların ortalamasıyla karşılaştırır. */
  insightFor: (target: PriceTarget) => PriceInsight;
  /** Tüm bölgelerde verilen oda tipinin ortalaması (yeterli ilan yoksa null). */
  cityAverage: (roomType: string) => { average: number; count: number } | null;
}

/**
 * Sitede yayındaki ilanlardan bölge + oda tipi bazlı fiyat indeksi kurar.
 * Ortalama sabit bir tablodan değil, ilanların gerçek kiralarından hesaplanır.
 */
export const buildPriceIndex = (listings: Pick<HousingListing, 'id' | 'district' | 'roomType' | 'price'>[]): PriceIndex => {
  const groups = new Map<string, Group>();
  const cityGroups = new Map<string, Group>();

  const add = (map: Map<string, Group>, key: string, id: string, price: number) => {
    const g = map.get(key) ?? { sum: 0, count: 0, prices: new Map<string, number>() };
    g.sum += price;
    g.count += 1;
    g.prices.set(id, price);
    map.set(key, g);
  };

  for (const l of listings) {
    if (!(l.price > 0)) continue;
    add(groups, `${l.district}|${l.roomType}`, l.id, l.price);
    add(cityGroups, String(l.roomType), l.id, l.price);
  }

  return {
    insightFor: (target) => {
      const g = groups.get(`${target.district}|${target.roomType}`);
      if (!g) return { ...UNKNOWN };
      const own = target.id !== undefined ? g.prices.get(target.id) : undefined;
      return insightFrom(target.price, g.sum - (own ?? 0), g.count - (own !== undefined ? 1 : 0));
    },
    cityAverage: (roomType) => {
      const g = cityGroups.get(roomType);
      if (!g || g.count < MIN_COMPARABLE_LISTINGS) return null;
      return { average: Math.round(g.sum / g.count), count: g.count };
    },
  };
};
