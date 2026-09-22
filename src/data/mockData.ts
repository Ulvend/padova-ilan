import { HousingListing, UserProfile, UserNotification } from '../types';

export const PADOVA_STATS = {
  averageSingolaPrice: '€435 / Singola',
  videoToursCount: '142 Doğrulandı',
  confirmationRate: '%98.4 Güncel',
  officialContractsCount: '310 İlan',
};

export const UNIPD_LANDMARKS = [
  {
    name: 'Palazzo Bo (UniPD Rektörlük & Hukuk)',
    lat: 45.4069,
    lng: 11.8770,
    type: 'Rektörlük & Hukuk',
    icon: 'Building2',
  },
  {
    name: 'Policlinico & Tıp Fakültesi (Scuola di Medicina)',
    lat: 45.4012,
    lng: 11.8905,
    type: 'Tıp & Cerrahi (MED)',
    icon: 'Stethoscope',
  },
  {
    name: 'Portello Mühendislik & Fen Kampüsü (DII)',
    lat: 45.4095,
    lng: 11.8932,
    type: 'Mühendislik & Fen',
    icon: 'Cpu',
  },
  {
    name: 'Complesso Beato Pellegrino (Beşeri Bilimler)',
    lat: 45.4140,
    lng: 11.8695,
    type: 'Edebiyat & Felsefe',
    icon: 'BookOpen',
  },
  {
    name: 'Stazione Ferroviaria Padova (Tren Garı)',
    lat: 45.4172,
    lng: 11.8797,
    type: 'Ulaşım Merkezi & Tramvay',
    icon: 'Train',
  },
  {
    name: 'Prato della Valle',
    lat: 45.3992,
    lng: 11.8755,
    type: 'Sosyal Meydan & Tramvay',
    icon: 'Landmark',
  },
];

export const DISTRICT_COORDINATES_MAP: Record<string, [number, number]> = {
  'Policlinico / Tıp Fakültesi (< 500m)': [45.4010, 11.8915],
  'Portello / Mühendislik & Fen (< 500m)': [45.4085, 11.8920],
  'Beato Pellegrino / Beşeri Bilimler': [45.4145, 11.8690],
  'Centro Storico / Prato della Valle': [45.4010, 11.8760],
  'Forcellini': [45.3975, 11.8980],
  'Arcella': [45.4240, 11.8820],
  'Guizza': [45.3820, 11.8715],
};

export const resolveListingCoords = (listing: Partial<HousingListing>, _index: number = 0): [number, number] => {
  if (
    typeof listing.lat === 'number' && 
    typeof listing.lng === 'number' && 
    !isNaN(listing.lat) && 
    !isNaN(listing.lng) && 
    listing.lat > 0 && 
    listing.lng > 0
  ) {
    return [listing.lat, listing.lng];
  }

  // Check geocoding cache from localStorage
  try {
    const raw = localStorage.getItem('padova_geocode_cache_v2');
    if (raw) {
      const cache = JSON.parse(raw);
      const key = (listing.streetAddress || '').toLowerCase().trim();
      if (cache[key]?.lat && cache[key]?.lng) {
        return [cache[key].lat, cache[key].lng];
      }
    }
  } catch (e) {}

  // Fallback to official district coordinates without fake jitter
  if (listing.district && DISTRICT_COORDINATES_MAP[listing.district]) {
    return DISTRICT_COORDINATES_MAP[listing.district];
  }

  // Default to historical Padova Centro
  return [45.4064, 11.8768];
};

export const INITIAL_HOUSING_LISTINGS: HousingListing[] = [];

export const INITIAL_CONVERSATIONS: import('../types').ConversationContact[] = [];

export const DISTRICT_BENCHMARKS: Record<string, {
  avgPriceSingola: number;
  avgPriceDoppia: number;
  canoneConcordatoRange: string;
  districtLabel: string;
  marketTrend: string;
}> = {
  'Policlinico / Tıp Fakültesi (< 500m)': {
    avgPriceSingola: 455,
    avgPriceDoppia: 320,
    canoneConcordatoRange: '€380 - €460',
    districtLabel: 'Policlinico & Giustiniani Bölgesi',
    marketTrend: 'Tıp fakültesi ve hastane yakınlığı sebebiyle talep çok yüksek',
  },
  'Portello / Mühendislik & Fen (< 500m)': {
    avgPriceSingola: 460,
    avgPriceDoppia: 330,
    canoneConcordatoRange: '€390 - €470',
    districtLabel: 'Portello & Piovego Kampüs Bölgesi',
    marketTrend: 'Mühendislik binaları ve kütüphanelere yürüme mesafesinde',
  },
  'Beato Pellegrino / Beşeri Bilimler': {
    avgPriceSingola: 430,
    avgPriceDoppia: 300,
    canoneConcordatoRange: '€370 - €440',
    districtLabel: 'Beato Pellegrino & Carmine',
    marketTrend: 'Edebiyat ve felsefe kompleksine yakın sakin yerleşim',
  },
  'Centro Storico / Prato della Valle': {
    avgPriceSingola: 480,
    avgPriceDoppia: 340,
    canoneConcordatoRange: '€410 - €500',
    districtLabel: 'Centro Storico / Prato della Valle',
    marketTrend: 'Tarihi merkez, sosyal hayat ve tramvay hattı üzerinde',
  },
  'Forcellini': {
    avgPriceSingola: 440,
    avgPriceDoppia: 310,
    canoneConcordatoRange: '€375 - €445',
    districtLabel: 'Forcellini & Nazareth Bölgesi',
    marketTrend: 'Hastanelere yakın, yeşil alanlı ve bisiklet dostu bölge',
  },
  'Arcella': {
    avgPriceSingola: 380,
    avgPriceDoppia: 270,
    canoneConcordatoRange: '€320 - €395',
    districtLabel: 'Arcella & Stanga',
    marketTrend: 'Tren istasyonuna yakın, tramvay ile merkeze 8 dk',
  },
  'Guizza': {
    avgPriceSingola: 390,
    avgPriceDoppia: 280,
    canoneConcordatoRange: '€330 - €400',
    districtLabel: 'Guizza & Bassanello',
    marketTrend: 'Tramvay güney son durağı, sakin ve ekonomik',
  },
};

export const INITIAL_AUTHORIZED_ADMIN_HASHES: string[] = [
  'usr_unipd_master_001', // Cenk B. Şimşek (Ana Admin)
  'usr_admin_dii_8421',    // Marco Bellini (Yetkili Admin)
];

export const DEFAULT_GUEST_USER: UserProfile = {
  id: '',
  userHash: 'guest',
  role: 'student',
  username: '',
  name: 'Misafir Kullanıcı',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=80',
  faculty: 'UniPD',
  studentIdVerified: false,
  ssoVerified: false,
  email: '',
  myListingsCount: 0,
  pendingApproval: 0,
  savedListings: [],
  compatibilityPreferences: {
    quietHours: '23:00 - 08:00',
    smoking: 'Sigarasız',
    studyVibe: 'Sessiz Çalışma',
    cleanlinessRating: '5/5 Titiz',
  },
};

export const CURRENT_USER: UserProfile = DEFAULT_GUEST_USER;

export const INITIAL_ARCHIVED_LISTINGS: HousingListing[] = [];

export const INITIAL_NOTIFICATIONS: UserNotification[] = [];


