import type { HousingListing, RoomType } from '../types';
import { listingAreaM2 } from './format';

// Bir karşılaştırmanın anlamlı sayılması için aynı bölge ve oda tipinde gereken en az "diğer" ilan sayısı.
export const MIN_COMPARABLE_LISTINGS = 3;

// Ortalamanın %95'i ve altı "uygun", %110'u ve üstü "yüksek" sayılır.
export const LOW_RATIO = 0.95;
export const HIGH_RATIO = 1.1;

export type PriceStatus = 'lower' | 'average' | 'higher' | 'unknown';

export interface PriceInsight {
  status: PriceStatus;
  /** Karşılaştırılan diğer ilanların ortalama m² başına kirası (€/m², 1 ondalık). Yeterli ilan yoksa 0. */
  average: number;
  /** Ortalamaya giren diğer ilan sayısı. */
  count: number;
  /** İlanın m² başına fiyatının ortalamadan yüzde sapması (mutlak değer, yuvarlanmış). */
  percentDiff: number;
  /** Bu ilanın m² başına kirası (€/m², 1 ondalık); fiyat veya metrekare yoksa 0. */
  pricePerM2: number;
  /** Karşılaştırmada kullanılan metrekare (Singola/Doppia: oda, Monolocale/Bilocale: evin tamamı). */
  areaM2: number;
}

export interface PriceTarget {
  id?: string;
  district: string;
  roomType: RoomType | string;
  price: number;
  roomM2?: number;
  apartmentM2?: number;
}

interface Entry {
  price: number;
  area: number;
}

interface Group {
  sumPrice: number;
  sumArea: number;
  count: number;
  entries: Map<string, Entry>;
}

const UNKNOWN: PriceInsight = { status: 'unknown', average: 0, count: 0, percentDiff: 0, pricePerM2: 0, areaM2: 0 };

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Ortalama m² başına kira: toplam kira / toplam metrekare (küçük odalardaki uç değerler ortalamayı bozmasın). */
const insightFrom = (price: number, area: number, sumPrice: number, sumArea: number, count: number): PriceInsight => {
  if (count < MIN_COMPARABLE_LISTINGS || !(sumArea > 0)) return { ...UNKNOWN, count };
  const avg = sumPrice / sumArea;
  const base = { ...UNKNOWN, average: round1(avg), count, areaM2: area > 0 ? area : 0 };
  if (!(price > 0) || !(area > 0)) return base;
  const perM2 = price / area;
  const ratio = perM2 / avg;
  const status: PriceStatus = ratio <= LOW_RATIO ? 'lower' : ratio >= HIGH_RATIO ? 'higher' : 'average';
  return { ...base, status, percentDiff: Math.round(Math.abs(ratio - 1) * 100), pricePerM2: round1(perM2) };
};

export interface PriceIndex {
  /** İlanı, aynı bölge ve oda tipindeki DİĞER ilanların m² başına ortalamasıyla karşılaştırır. */
  insightFor: (target: PriceTarget) => PriceInsight;
  /** Tüm bölgelerde verilen oda tipinin m² başına ortalaması (yeterli ilan yoksa null). */
  cityAverage: (roomType: string) => { average: number; count: number } | null;
}

/**
 * Sitede yayındaki ilanlardan bölge + oda tipi bazlı m² başına fiyat indeksi kurar.
 * Singola/Doppia oda metrekaresine, Monolocale/Bilocale evin tüm metrekaresine göre hesaplanır (listingAreaM2).
 * Ortalama sabit bir tablodan değil, ilanların gerçek kiralarından hesaplanır.
 */
export const buildPriceIndex = (
  listings: Pick<HousingListing, 'id' | 'district' | 'roomType' | 'price' | 'roomM2' | 'apartmentM2'>[]
): PriceIndex => {
  const groups = new Map<string, Group>();
  const cityGroups = new Map<string, Group>();

  const add = (map: Map<string, Group>, key: string, id: string, entry: Entry) => {
    const g = map.get(key) ?? { sumPrice: 0, sumArea: 0, count: 0, entries: new Map<string, Entry>() };
    g.sumPrice += entry.price;
    g.sumArea += entry.area;
    g.count += 1;
    g.entries.set(id, entry);
    map.set(key, g);
  };

  for (const l of listings) {
    const area = listingAreaM2(l);
    if (!(l.price > 0) || !(area > 0)) continue;
    const entry = { price: l.price, area };
    add(groups, `${l.district}|${l.roomType}`, l.id, entry);
    add(cityGroups, String(l.roomType), l.id, entry);
  }

  return {
    insightFor: (target) => {
      const area = listingAreaM2({
        roomType: target.roomType as RoomType,
        roomM2: target.roomM2 ?? 0,
        apartmentM2: target.apartmentM2 ?? 0,
      });
      const g = groups.get(`${target.district}|${target.roomType}`);
      if (!g) return { ...UNKNOWN };
      const own = target.id !== undefined ? g.entries.get(target.id) : undefined;
      return insightFrom(
        target.price,
        area,
        g.sumPrice - (own?.price ?? 0),
        g.sumArea - (own?.area ?? 0),
        g.count - (own ? 1 : 0)
      );
    },
    cityAverage: (roomType) => {
      const g = cityGroups.get(roomType);
      if (!g || g.count < MIN_COMPARABLE_LISTINGS) return null;
      return { average: round1(g.sumPrice / g.sumArea), count: g.count };
    },
  };
};
