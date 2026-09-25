import type { HousingListing } from '../types';

// Eski kayıtlarda sözleşme tipi olarak saklanan değer; artık "devir" ayrı bir bayrak (isSubentro) ve gerçek sözleşme tipi ayrı seçilir.
// Sunucu karşılığı: 0030_subentro_flag.sql (is_subentro sütunu ve radar eşleşmesi).
export const LEGACY_SUBENTRO_CONTRACT = 'Subentro (Resmi Sözleşme Devri)' as const;

export const isSubentroListing = (l: Pick<HousingListing, 'isSubentro' | 'contractType'>): boolean =>
  Boolean(l.isSubentro) || l.contractType === LEGACY_SUBENTRO_CONTRACT;
