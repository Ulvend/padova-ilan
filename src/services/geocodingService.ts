import { UNIPD_LANDMARKS, DISTRICT_COORDINATES_MAP } from '../data/mockData';
import { landmarkLabel } from '../utils/landmarkText';
import type { Language } from '../types';

export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
  road?: string;
  houseNumber?: string;
  suburb?: string;
  postcode?: string;
}

export interface AddressSuggestion {
  lat: number;
  lng: number;
  displayName: string;
  streetName: string;
  suburb?: string;
}

const CACHE_KEY = 'padova_geocode_cache_v2';

// In-memory cache backed by localStorage
const getCache = (): Record<string, GeocodeResult> => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
};

const setCache = (key: string, value: GeocodeResult) => {
  try {
    const cache = getCache();
    cache[key.toLowerCase().trim()] = value;
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.warn('Failed to save geocode cache', e);
  }
};

/**
 * Bounds around Padova metropolitan area
 * Min Lat: 45.33, Max Lat: 45.48, Min Lng: 11.75, Max Lng: 12.00
 */
const PADOVA_BOUNDS = {
  minLat: 45.33,
  maxLat: 45.48,
  minLng: 11.75,
  maxLng: 12.00,
};

const isWithinPadova = (lat: number, lng: number): boolean => {
  return (
    lat >= PADOVA_BOUNDS.minLat &&
    lat <= PADOVA_BOUNDS.maxLat &&
    lng >= PADOVA_BOUNDS.minLng &&
    lng <= PADOVA_BOUNDS.maxLng
  );
};

/**
 * Searches OpenStreetMap Nominatim for address suggestions in Padova as the user types
 */
export const searchAddressSuggestions = async (query: string): Promise<AddressSuggestion[]> => {
  const clean = query.trim();
  if (!clean || clean.length < 3) return [];

  // Build query emphasizing Padova, Italy
  const searchQuery = clean.toLowerCase().includes('padova') 
    ? clean 
    : `${clean}, Padova, Italy`;

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(searchQuery)}&viewbox=11.75,45.48,12.00,45.33&bounded=0`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) return [];

    const data = await response.json();
    if (!Array.isArray(data)) return [];

    const results: AddressSuggestion[] = [];

    for (const item of data) {
      const lat = parseFloat(item.lat);
      const lng = parseFloat(item.lon);
      if (isNaN(lat) || isNaN(lng)) continue;

      // Extract road or building
      const road = item.address?.road || item.name || '';
      const houseNumber = item.address?.house_number ? ` ${item.address.house_number}` : '';
      const suburb = item.address?.suburb || item.address?.neighbourhood || item.address?.quarter || '';
      const streetName = road ? `${road}${houseNumber}` : item.name || clean;

      results.push({
        lat,
        lng,
        displayName: item.display_name,
        streetName: suburb ? `${streetName} (${suburb})` : streetName,
        suburb,
      });
    }

    return results;
  } catch (error) {
    console.warn('Nominatim search error:', error);
    return [];
  }
};

/**
 * Geocodes an address string using real OpenStreetMap Nominatim Geocoding API.
 * Automatically falls back to district coordinate if address not found or network fails.
 */
export const geocodeAddress = async (
  address: string,
  district?: string
): Promise<GeocodeResult | null> => {
  const cleanAddress = address.trim();
  if (!cleanAddress) {
    if (district && DISTRICT_COORDINATES_MAP[district]) {
      const [dLat, dLng] = DISTRICT_COORDINATES_MAP[district];
      return {
        lat: dLat,
        lng: dLng,
        displayName: `${district}, Padova, Italia`,
      };
    }
    return null;
  }

  const cacheKey = cleanAddress.toLowerCase();
  const cached = getCache()[cacheKey];
  if (cached) {
    return cached;
  }

  // Format request to Padova, Italy
  const query = cleanAddress.toLowerCase().includes('padova') 
    ? cleanAddress 
    : `${cleanAddress}, Padova, Italia`;

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=3&q=${encodeURIComponent(query)}&viewbox=11.75,45.48,12.00,45.33&bounded=0`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        // Find best match in Padova
        let best = data[0];
        for (const candidate of data) {
          const cLat = parseFloat(candidate.lat);
          const cLng = parseFloat(candidate.lon);
          if (isWithinPadova(cLat, cLng)) {
            best = candidate;
            break;
          }
        }

        const lat = parseFloat(best.lat);
        const lng = parseFloat(best.lon);

        if (!isNaN(lat) && !isNaN(lng)) {
          const result: GeocodeResult = {
            lat,
            lng,
            displayName: best.display_name,
            road: best.address?.road,
            houseNumber: best.address?.house_number,
            suburb: best.address?.suburb || best.address?.neighbourhood,
            postcode: best.address?.postcode,
          };

          setCache(cacheKey, result);
          return result;
        }
      }
    }
  } catch (error) {
    console.warn('Real geocoding request failed, falling back:', error);
  }

  // Graceful fallback to district official center WITHOUT random jitter
  if (district && DISTRICT_COORDINATES_MAP[district]) {
    const [dLat, dLng] = DISTRICT_COORDINATES_MAP[district];
    const fallback: GeocodeResult = {
      lat: dLat,
      lng: dLng,
      displayName: `${district}, Padova`,
    };
    return fallback;
  }

  // Padova central landmark default
  return {
    lat: 45.4064,
    lng: 11.8768,
    displayName: 'Centro Storico, Padova',
  };
};

/**
 * Reverse geocodes coordinates (lat, lng) to a street address and neighborhood in Padova.
 * Useful when user clicks on the map to place an exact pin.
 */
export const reverseGeocode = async (
  lat: number,
  lng: number
): Promise<{ streetAddress: string; district?: string; displayName: string } | null> => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (!data || !data.address) return null;

    const road = data.address.road || data.address.pedestrian || data.address.street || '';
    const houseNumber = data.address.house_number ? ` ${data.address.house_number}` : '';
    const suburb = data.address.suburb || data.address.neighbourhood || data.address.quarter || '';
    
    let streetAddress = road ? `${road}${houseNumber}` : data.display_name.split(',')[0];
    if (suburb && !streetAddress.includes(suburb)) {
      streetAddress = `${streetAddress}, ${suburb}`;
    }

    return {
      streetAddress,
      district: suburb,
      displayName: data.display_name,
    };
  } catch (error) {
    console.warn('Reverse geocoding error:', error);
    return null;
  }
};

/**
 * Calculates Haversine distance in meters between two lat/lng points
 */
export const calculateDistanceMeters = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
};

/**
 * Finds the nearest UniPD faculty/campus to the given coordinates
 * and estimates walking time based on average walking speed (80 m/min = 4.8 km/h).
 */
export const calculateNearestFaculty = (
  lat: number,
  lng: number,
  lang: string = 'tr'
): {
  landmarkName: string;
  distanceMeters: number;
  walkMinutes: number;
  formattedText: string;
} => {
  let minDistance = Infinity;
  let nearest = UNIPD_LANDMARKS[0];

  for (const landmark of UNIPD_LANDMARKS) {
    const dist = calculateDistanceMeters(lat, lng, landmark.lat, landmark.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = landmark;
    }
  }

  const landmarkName = landmarkLabel(nearest.name, nearest.type, (lang as Language) in { tr: 1, en: 1, it: 1, de: 1, ru: 1, hi: 1 } ? (lang as Language) : 'tr').name;
  const walkMinutes = Math.max(1, Math.round(minDistance / 75)); // ~75m/min walking speed through historical streets
  const distFormatted = minDistance < 1000 ? `${minDistance}m` : `${(minDistance / 1000).toFixed(1)} km`;

  let formattedText = `${landmarkName}: ${distFormatted} (${walkMinutes} dk yürüme)`;
  if (lang === 'it') {
    formattedText = `${landmarkName}: ${distFormatted} (${walkMinutes} min a piedi)`;
  } else if (lang === 'en') {
    formattedText = `${landmarkName}: ${distFormatted} (${walkMinutes} min walk)`;
  } else if (lang === 'de') {
    formattedText = `${landmarkName}: ${distFormatted} (${walkMinutes} Min. zu Fuß)`;
  } else if (lang === 'ru') {
    formattedText = `${landmarkName}: ${distFormatted} (${walkMinutes} мин пешком)`;
  } else if (lang === 'hi') {
    formattedText = `${landmarkName}: ${distFormatted} (${walkMinutes} मिनट पैदल)`;
  }

  return {
    landmarkName: nearest.name,
    distanceMeters: minDistance,
    walkMinutes,
    formattedText,
  };
};
