import type { ContractType, DistrictArea, EnergyClass, HousingListing, RoomType } from '../types';
import { DISTRICT_COORDINATES_MAP } from './mockData';
import { calculateNearestFaculty } from '../services/geocodingService';

// YALNIZCA GELİŞTİRME: ana sayfayı çok ilanla görmek için sahte ilan üretir (AppContext, `?demo=N` adresi).
// Veritabanına yazılmaz ve üretim paketine girmez (çağıran taraf import.meta.env.DEV ile dinamik yükler).

const DISTRICTS = Object.keys(DISTRICT_COORDINATES_MAP) as DistrictArea[];

const STREETS: Record<string, string[]> = {
  'Policlinico / Tıp Fakültesi (< 500m)': ['Via Giustiniani', 'Via Loredan', 'Via Falloppio', 'Via San Massimo'],
  'Portello / Mühendislik & Fen (< 500m)': ['Via Marzolo', 'Via Belzoni', 'Via Venezia', 'Via Jappelli'],
  'Beato Pellegrino / Beşeri Bilimler': ['Via Beato Pellegrino', 'Via del Carmine', 'Via Vescovado', 'Via Cesarotti'],
  'Centro Storico': ['Via Roma', 'Via Altinate', 'Via San Francesco', 'Riviera Tito Livio'],
  'Prato della Valle': ['Via Umberto I', 'Via Cavazzana', 'Via Sant\'Eufemia', 'Via Ognissanti'],
  Forcellini: ['Via Forcellini', 'Via Facciolati', 'Via Bajardi', 'Via Vigonovese'],
  Arcella: ['Via Tiziano Aspetti', 'Via Pindemonte', 'Via Jacopo d\'Avanzo', 'Via Dal Piaz'],
  Guizza: ['Via Guizza', 'Via Chiesanuova', 'Via Bassanello', 'Via Pertile'],
};

const FIRST = ['Giulia', 'Marco', 'Elif', 'Luca', 'Sara', 'Emre', 'Chiara', 'Davide', 'Zeynep', 'Matteo', 'Anna', 'Can', 'Elena', 'Paolo', 'Ayşe', 'Sofia', 'Andrea', 'Deniz', 'Marta', 'Ivan'];
const DEPARTMENTS = ['Medicina', 'Ingegneria', 'Lettere', 'Giurisprudenza', 'Psicologia', 'Economia', 'Scienze', 'Farmacia'];
const ROOM_TYPES: RoomType[] = ['Singola', 'Singola', 'Doppia', 'Singola', 'Monolocale', 'Bilocale', 'Singola', 'Doppia'];
const CONTRACTS: ContractType[] = [
  'Contratto per Studenti (Canone Concordato)',
  'Contratto per Studenti (Canone Concordato)',
  'Contratto Transitorio (1-18 Ay)',
  'Standart 4+4 / 3+2 Yıllık',
  'Contratto per Studenti (Canone Concordato)',
];
const ENERGY: EnergyClass[] = ['A2', 'B', 'C', 'D', 'E', 'pending', 'C', 'B'];
const TITLES: Record<RoomType, string[]> = {
  Singola: ['Singola luminosa', 'Singola con balcone', 'Singola silenziosa', 'Camera singola arredata'],
  Doppia: ['Doppia spaziosa', 'Posto in doppia', 'Doppia con scrivania'],
  Monolocale: ['Monolocale ristrutturato', 'Monolocale arredato', 'Monolocale vicino al tram'],
  Bilocale: ['Bilocale luminoso', 'Bilocale arredato', 'Bilocale al terzo piano'],
};

// Sabit tohumlu sayı üretici: her açılışta aynı ilanlar çıksın.
const rng = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const svgUri = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

const photo = (i: number, label: string) => {
  const hue = (i * 47) % 360;
  return svgUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">` +
      `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue},45%,72%)"/><stop offset="1" stop-color="hsl(${(hue + 40) % 360},50%,48%)"/></linearGradient></defs>` +
      `<rect width="800" height="600" fill="url(#g)"/>` +
      `<g fill="rgba(255,255,255,.85)"><path d="M400 190 250 320h40v120h90v-80h40v80h90V320h40z"/></g>` +
      `<text x="400" y="520" font-family="sans-serif" font-size="34" font-weight="700" text-anchor="middle" fill="rgba(255,255,255,.9)">${label}</text></svg>`
  );
};

const avatar = (name: string, i: number) =>
  svgUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" fill="hsl(${(i * 61) % 360},40%,45%)"/>` +
      `<text x="48" y="62" font-family="sans-serif" font-size="44" font-weight="700" text-anchor="middle" fill="#fff">${name[0]}</text></svg>`
  );

export const generateDemoListings = (count = 20): HousingListing[] => {
  const now = Date.now();
  const today = new Date();
  const list: HousingListing[] = [];

  for (let i = 0; i < count; i++) {
    const rand = rng(1000 + i * 97);
    const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];

    const district = DISTRICTS[i % DISTRICTS.length];
    const roomType = ROOM_TYPES[i % ROOM_TYPES.length];
    const [dLat, dLng] = DISTRICT_COORDINATES_MAP[district];
    // Her 9. ilan bir öncekiyle birebir aynı noktada (aynı bina): kümeleme/yelpaze davranışını denemek için.
    const twin = i % 9 === 8 ? list[i - 1] : null;
    const lat = twin?.lat ?? dLat + (rand() - 0.5) * 0.006;
    const lng = twin?.lng ?? dLng + (rand() - 0.5) * 0.008;
    const street = pick(STREETS[district] ?? ['Via Roma']);
    const number = 1 + Math.floor(rand() * 90);

    const wholeFlat = roomType === 'Monolocale' || roomType === 'Bilocale';
    const price = wholeFlat ? 520 + Math.round(rand() * 280 / 10) * 10 : 260 + Math.round((rand() * 240) / 10) * 10;
    const apartmentM2 = wholeFlat ? (roomType === 'Monolocale' ? 28 + Math.floor(rand() * 14) : 42 + Math.floor(rand() * 18)) : 55 + Math.floor(rand() * 45);
    const roomM2 = wholeFlat ? apartmentM2 : (roomType === 'Doppia' ? 16 : 10) + Math.floor(rand() * 8);

    const start = new Date(today);
    start.setDate(start.getDate() + Math.floor(rand() * 75));
    const end = new Date(start);
    // Her 3. ilan kısa dönem (3–5 ay, ör. Erasmus); diğerleri 6–13 ay.
    end.setMonth(end.getMonth() + (i % 3 === 0 ? 3 + Math.floor(rand() * 3) : 6 + Math.floor(rand() * 8)));

    const first = FIRST[i % FIRST.length];
    const hasVideo = rand() > 0.55;
    const verified = rand() > 0.4;
    const gender = pick(['any', 'any', 'female_only', 'male_only'] as const);
    const housemates = wholeFlat ? 1 : 2 + Math.floor(rand() * 3);
    const nearest = calculateNearestFaculty(lat, lng, 'it');

    const hoursAgo = i * 5 + Math.floor(rand() * 4);
    const createdAt = new Date(now - hoursAgo * 3_600_000).toISOString();

    list.push({
      id: `demo-${String(i + 1).padStart(2, '0')}`,
      userId: `demo-user-${i}`,
      title: `${pick(TITLES[roomType])} · ${street.replace(/^(Via|Riviera) /, '')}`,
      district,
      streetAddress: `${street} ${number}, Padova`,
      distanceToFaculty: nearest.formattedText,
      price,
      expenses: rand() > 0.5 ? 'Spese incluse' : `+€${40 + Math.floor(rand() * 5) * 10} spese`,
      deposit: price * (1 + Math.floor(rand() * 2)),
      condoFees: rand() > 0.6 ? 20 + Math.floor(rand() * 5) * 10 : undefined,
      fairPriceStatus: 'average',
      fairPriceText: '',
      roomType,
      contractType: CONTRACTS[i % CONTRACTS.length],
      isSubentro: i % 4 === 3,
      contractStartISO: iso(start),
      contractStartDate: new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }).format(start),
      contractEndISO: iso(end),
      contractEndDate: new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }).format(end),
      hasVideoTour: hasVideo,
      isStudentCardVerified: verified,
      currentFlatmates: [],
      totalHousemates: housemates,
      genderPreference: gender,
      femaleCount: gender === 'male_only' ? 0 : 1 + Math.floor(rand() * 2),
      maleCount: gender === 'female_only' ? 0 : Math.floor(rand() * 2),
      occupantType: pick(['students_only', 'mixed', 'students_only'] as const),
      smokingAllowed: rand() > 0.8,
      petsAllowed: rand() > 0.75,
      heatingType: rand() > 0.5 ? 'autonomo' : 'centralizzato',
      hasAirConditioning: rand() > 0.6,
      hasWashingMachine: rand() > 0.15,
      hasWifi: true,
      hasBikeParking: rand() > 0.5,
      hasParking: rand() > 0.8,
      roomM2,
      apartmentM2,
      bathrooms: 1 + Math.floor(rand() * 2),
      energyClass: ENERGY[i % ENERGY.length],
      floor: Math.floor(rand() * 5),
      hasElevator: rand() > 0.5,
      confirmationTimeLeft: '',
      description: 'Annuncio di esempio generato per l\'anteprima: non è un annuncio reale.',
      poster: {
        id: `demo-user-${i}`,
        username: `demo_${first.toLowerCase()}${i}`,
        name: first,
        avatar: avatar(first, i),
        verifiedUniPD: verified,
        department: pick(DEPARTMENTS),
      },
      images: [photo(i, roomType), photo(i + 7, street)],
      createdAt,
      confirmedAt: createdAt,
      views: Math.floor(rand() * 140),
      lat,
      lng,
    });
  }
  return list;
};
