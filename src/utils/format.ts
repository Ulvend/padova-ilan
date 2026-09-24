import type { Language } from '../types';

// Yüzde işareti Türkçe'de sayıdan önce (%3), diğer dillerde sonra (3%) yazılır.
export const formatPercent = (n: number, lang: Language): string => (lang === 'tr' ? `%${n}` : `${n}%`);

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
