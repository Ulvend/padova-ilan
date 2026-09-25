import type { HousingListing, Language } from '../types';

// Yüzde işareti Türkçe'de sayıdan önce (%3), diğer dillerde sonra (3%) yazılır.
export const formatPercent = (n: number, lang: Language): string => (lang === 'tr' ? `%${n}` : `${n}%`);

// Monolocale / Bilocale bütün bir daire olarak kiralanır: kartlarda evin metrekaresi gösterilir.
// Singola ve Doppia'da kiralanan şey oda olduğu için oda metrekaresi gösterilir.
// Çevrilmiş ilan değil ham ilan verilmelidir (roomType dile göre çevrilir).
export const listingAreaM2 = (l: Pick<HousingListing, 'roomType' | 'roomM2' | 'apartmentM2'>): number =>
  (l.roomType === 'Monolocale' || l.roomType === 'Bilocale') && l.apartmentM2 ? l.apartmentM2 : l.roomM2;

// "2 Banyo" gibi kısa, çoğul kurallarına uyan banyo sayısı metni.
export const formatBathrooms = (n: number, lang: Language): string => {
  switch (lang) {
    case 'tr':
      return `${n} Banyo`;
    case 'it':
      return n === 1 ? '1 Bagno' : `${n} Bagni`;
    case 'de':
      return n === 1 ? '1 Bad' : `${n} Bäder`;
    case 'ru':
      return n === 1 ? '1 санузел' : n >= 2 && n <= 4 ? `${n} санузла` : `${n} санузлов`;
    case 'hi':
      return `${n} बाथरूम`;
    default:
      return n === 1 ? '1 Bathroom' : `${n} Bathrooms`;
  }
};

/** Kat metni: 0 → "Zemin kat", negatif → "Bodrum / seminterrato", diğerleri → "3. kat". */
export const formatFloor = (
  floor: number,
  t: { floorGround: string; floorBasement: string; floorValue: string }
): string => (floor === 0 ? t.floorGround : floor < 0 ? t.floorBasement : t.floorValue.replace('{n}', String(floor)));
