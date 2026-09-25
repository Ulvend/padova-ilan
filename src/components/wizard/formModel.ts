import {
  ContractType,
  DistrictArea,
  EnergyClass,
  HousingListing,
  Language,
  RoomType,
  UserProfile,
  VideoAngle,
} from '../../types';
import { DISTRICT_COORDINATES_MAP } from '../../data/mockData';
import { calculateNearestFaculty } from '../../services/geocodingService';
import { landmarkLabel } from '../../utils/landmarkText';
import { WIZARD_TEXT, LANG_LOCALE } from '../../utils/wizardText';
import { TRANSLATIONS } from '../../utils/translations';
import { ENERGY_PERFORMANCE_MAX, isRatedEnergyClass } from '../../utils/energy';
import { MIN_STAY_DAYS, stayDays, termFromDates } from '../../utils/rentalTerm';
import { LEGACY_SUBENTRO_CONTRACT, isSubentroListing } from '../../utils/subentro';

export type PhotoStatus = 'done' | 'uploading' | 'error';

export interface PhotoItem {
  id: string;
  url: string; // uzak URL ya da blob: önizleme
  status: PhotoStatus;
  progress: number;
  file?: File;
  // Başka bir kullanıcının fotoğrafına çok benziyor (sunucu tespiti); yalnızca uyarı, yayını engellemez.
  similar?: boolean;
}

export interface AngleForm {
  desk?: string;
  kitchen?: string;
  balcony?: string;
}

export interface FormState {
  roomType: RoomType;
  title: string;
  streetAddress: string;
  district: DistrictArea;
  lat: number;
  lng: number;

  price: string;
  expensesIncluded: boolean;
  expensesAmount: string;
  deposit: string;
  condoFees: string;
  contractType: ContractType;
  // Sözleşme devri (subentro) ilanı; işaretliyse ev sahibi onayı beyanı zorunludur.
  isSubentro: boolean;
  landlordConsent: boolean;
  startDate: string;
  endDate: string;
  // Kısa dönem (1–6 ay) ilanlarda zorunlu: konut amaçlı geçici kiralama beyanı (turistik / 30 gün ve altı kiralama değil).
  purposeAck: boolean;

  roomM2: string;
  apartmentM2: string;
  bathrooms: number;
  // Ev bilgileri: enerji sınıfı zorunlu; kat boş bırakılabilir (0 = zemin, -1 = bodrum).
  energyClass: EnergyClass | '';
  energyPerformance: string;
  floor: string;
  hasElevator: boolean;
  floorPlanUrl: string;
  heatingType: 'autonomo' | 'centralizzato';
  hasAirConditioning: boolean;
  hasWashingMachine: boolean;
  hasWifi: boolean;
  hasBikeParking: boolean;
  bikeParkingDetails: string;
  hasParking: boolean;
  parkingDetails: string;
  smokingAllowed: boolean;
  petsAllowed: boolean;
  description: string;

  photos: PhotoItem[];
  hasVideoTour: boolean;
  videoUrl: string;
  angles: AngleForm;

  totalHousemates: number;
  femaleCount: number;
  maleCount: number;
  genderPreference: 'female_only' | 'male_only' | 'any';
  occupantType: 'students_only' | 'workers_only' | 'mixed';
}

export const STEP_COUNT = 6;

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const DEFAULT_DISTRICT: DistrictArea = 'Policlinico / Tıp Fakültesi (< 500m)';

export const createInitialForm = (): FormState => {
  const [lat, lng] = DISTRICT_COORDINATES_MAP[DEFAULT_DISTRICT];
  return {
    roomType: 'Singola',
    title: '',
    streetAddress: '',
    district: DEFAULT_DISTRICT,
    lat,
    lng,
    price: '',
    expensesIncluded: false,
    expensesAmount: '',
    deposit: '',
    condoFees: '',
    contractType: 'Contratto per Studenti (Canone Concordato)',
    isSubentro: false,
    landlordConsent: false,
    startDate: todayISO(),
    endDate: '',
    purposeAck: false,
    roomM2: '',
    apartmentM2: '',
    bathrooms: 1,
    energyClass: '',
    energyPerformance: '',
    floor: '',
    hasElevator: false,
    floorPlanUrl: '',
    heatingType: 'autonomo',
    hasAirConditioning: false,
    hasWashingMachine: false,
    hasWifi: false,
    hasBikeParking: false,
    bikeParkingDetails: '',
    hasParking: false,
    parkingDetails: '',
    smokingAllowed: false,
    petsAllowed: false,
    description: '',
    photos: [],
    hasVideoTour: false,
    videoUrl: '',
    angles: {},
    totalHousemates: 3,
    femaleCount: 0,
    maleCount: 0,
    genderPreference: 'any',
    occupantType: 'students_only',
  };
};

// ---------- Taslak (yalnızca yükleme tamamlanmış fotoğraflar saklanır) ----------

const DRAFT_KEY = 'padova_listing_wizard_draft_v1';

export const loadDraft = (): { form: FormState; step: number } | null => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return { form: { ...createInitialForm(), ...parsed.form, photos: parsed.form?.photos ?? [] }, step: parsed.step ?? 0 };
  } catch {
    return null;
  }
};

export const saveDraft = (form: FormState, step: number) => {
  try {
    const persistable = { ...form, photos: form.photos.filter((p) => p.status === 'done').map(({ file, ...rest }) => rest) };
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ form: persistable, step }));
  } catch {
    /* depolama dolu/kapalı olabilir; taslak isteğe bağlı */
  }
};

export const clearDraft = () => {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* yoksay */
  }
};

export const isDraftMeaningful = (f: FormState) =>
  Boolean(f.title.trim() || f.price || f.streetAddress.trim() || f.photos.length || f.description.trim());

// ---------- Konum ----------

/** Koordinata en yakın semt merkezini bulur. */
export const districtFromCoords = (lat: number, lng: number): DistrictArea => {
  let best: DistrictArea = DEFAULT_DISTRICT;
  let bestD = Infinity;
  for (const [name, [dLat, dLng]] of Object.entries(DISTRICT_COORDINATES_MAP)) {
    const d = (lat - dLat) ** 2 + ((lng - dLng) * Math.cos((lat * Math.PI) / 180)) ** 2;
    if (d < bestD) {
      bestD = d;
      best = name as DistrictArea;
    }
  }
  return best;
};

export const travelEstimate = (lat: number, lng: number, lang: Language) => {
  const n = calculateNearestFaculty(lat, lng, lang);
  const name = landmarkLabel(n.landmarkName, '', lang).name;
  // Otobüs: ~15 km/s ortalama + 4 dk bekleme/yürüme payı. Yalnızca yaklaşık değer.
  const busMinutes = Math.max(4, Math.round(n.distanceMeters / 250) + 4);
  return { name, walkMinutes: n.walkMinutes, busMinutes, distanceMeters: n.distanceMeters, text: n.formattedText };
};

// ---------- Tarih / gider biçimleri ----------

export const formatDate = (iso: string, lang: Language) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  return new Intl.DateTimeFormat(LANG_LOCALE[lang], { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  );
};

export const formatExpenses = (f: FormState, lang: Language) => {
  const w = WIZARD_TEXT[lang];
  const amount = Number(f.expensesAmount);
  if (f.expensesIncluded || !amount) return f.expensesIncluded ? w.expensesIncludedText : '';
  return `+€${amount} ${w.expensesExtraText}`;
};

const parseExpenses = (s: string | undefined): { included: boolean; amount: string } => {
  const m = s ? /(\d+(?:[.,]\d+)?)/.exec(s) : null;
  if (m) return { included: false, amount: m[1].replace(',', '.') };
  return { included: Boolean(s && s.trim()), amount: '' };
};

// ---------- İlan ↔ form dönüşümleri ----------

export const FLOOR_MIN = -2;
export const FLOOR_MAX = 60;

/** Kat metnini tam sayıya çevirir; boş ya da geçersizse undefined. */
const parseFloor = (value: string): number | undefined => {
  if (value.trim() === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : undefined;
};

const ANGLE_FIELDS: { key: keyof AngleForm; id: VideoAngle['id']; label: string }[] = [
  { key: 'desk', id: 'desk', label: 'Çalışma Masası' },
  { key: 'kitchen', id: 'kitchen', label: 'Mutfak / Ortak Alan' },
  { key: 'balcony', id: 'view', label: 'Balkon / Manzara' },
];

export const formFromListing = (l: HousingListing): FormState => {
  const base = createInitialForm();
  const exp = parseExpenses(l.expenses);
  const angles: AngleForm = {};
  for (const f of ANGLE_FIELDS) {
    const match = l.videoAngles?.find((a) => a.id === f.id);
    if (match) angles[f.key] = match.videoUrl;
  }
  const mainVideo = l.videoUrl || l.videoAngles?.find((a) => a.id === 'room')?.videoUrl || '';
  return {
    ...base,
    roomType: l.roomType,
    title: l.title,
    streetAddress: l.streetAddress || '',
    district: l.district,
    lat: l.lat ?? base.lat,
    lng: l.lng ?? base.lng,
    price: String(l.price ?? ''),
    expensesIncluded: exp.included,
    expensesAmount: exp.amount,
    deposit: l.deposit ? String(l.deposit) : '',
    condoFees: l.condoFees ? String(l.condoFees) : '',
    contractType: l.contractType,
    isSubentro: isSubentroListing(l),
    // Mevcut ilanı düzenlerken beyan yeniden istenmez.
    landlordConsent: true,
    startDate: l.contractStartISO || todayISO(),
    endDate: l.contractEndISO || '',
    // Mevcut ilanı düzenlerken beyan yeniden istenmez.
    purposeAck: true,
    roomM2: l.roomM2 ? String(l.roomM2) : '',
    apartmentM2: l.apartmentM2 ? String(l.apartmentM2) : '',
    bathrooms: l.bathrooms || 1,
    energyClass: l.energyClass || '',
    energyPerformance: l.energyPerformance ? String(l.energyPerformance) : '',
    floor: l.floor !== undefined ? String(l.floor) : '',
    hasElevator: Boolean(l.hasElevator),
    floorPlanUrl: l.floorPlanUrl || '',
    heatingType: l.heatingType || 'autonomo',
    hasAirConditioning: Boolean(l.hasAirConditioning),
    hasWashingMachine: Boolean(l.hasWashingMachine),
    hasWifi: Boolean(l.hasWifi),
    hasBikeParking: Boolean(l.hasBikeParking),
    bikeParkingDetails: l.bikeParkingDetails || '',
    hasParking: Boolean(l.hasParking),
    parkingDetails: l.parkingDetails || '',
    smokingAllowed: Boolean(l.smokingAllowed),
    petsAllowed: Boolean(l.petsAllowed),
    description: l.description || '',
    photos: (l.images || []).map((url, i) => ({ id: `existing-${i}`, url, status: 'done' as const, progress: 100 })),
    hasVideoTour: Boolean(l.hasVideoTour),
    videoUrl: mainVideo,
    angles,
    totalHousemates: l.totalHousemates || 3,
    femaleCount: l.femaleCount ?? 0,
    maleCount: l.maleCount ?? 0,
    genderPreference: l.genderPreference || 'any',
    occupantType: l.occupantType || 'students_only',
  };
};

const buildAngles = (f: FormState): VideoAngle[] | undefined => {
  const angles: VideoAngle[] = [];
  for (const a of ANGLE_FIELDS) {
    const url = f.angles[a.key]?.trim();
    if (url) angles.push({ id: a.id, label: a.label, videoUrl: url });
  }
  return angles.length ? angles : undefined;
};

/** Formdan ilan verisi üretir (canlı önizleme ve kayıt için ortak). */
export const buildListing = (
  f: FormState,
  opts: { lang: Language; user?: UserProfile; existing?: HousingListing | null; id?: string }
): HousingListing => {
  const { lang, user, existing } = opts;
  const price = Number(f.price) || 0;
  const videoAngles = f.hasVideoTour ? buildAngles(f) : undefined;
  const videoUrl = f.hasVideoTour ? f.videoUrl.trim() || undefined : undefined;
  const travel = travelEstimate(f.lat, f.lng, lang);
  const w = WIZARD_TEXT[lang];

  return {
    ...(existing ?? {}),
    id: existing?.id ?? opts.id ?? 'preview',
    title: f.title.trim() || '—',
    district: f.district,
    streetAddress: f.streetAddress.trim() || 'Padova',
    lat: f.lat,
    lng: f.lng,
    distanceToFaculty: travel.text,
    price,
    expenses: formatExpenses(f, lang),
    deposit: Number(f.deposit) > 0 ? Number(f.deposit) : undefined,
    condoFees: Number(f.condoFees) > 0 ? Number(f.condoFees) : undefined,
    // Fiyat karşılaştırması artık sitedeki güncel ilanlardan hesaplanır; bu alanlar yalnızca eski kayıtlar için durur.
    fairPriceStatus: existing?.fairPriceStatus ?? 'average',
    fairPriceText: existing?.fairPriceText ?? '',
    roomType: f.roomType,
    contractType: f.contractType,
    isSubentro: f.isSubentro,
    contractStartDate: f.startDate ? formatDate(f.startDate, lang) : undefined,
    contractStartISO: f.startDate || undefined,
    contractEndDate: f.endDate ? formatDate(f.endDate, lang) : undefined,
    contractEndISO: f.endDate || undefined,
    hasVideoTour: Boolean(f.hasVideoTour && (videoUrl || videoAngles?.length)),
    videoUrl,
    videoAngles,
    videoTitle: f.hasVideoTour ? existing?.videoTitle || w.videoTitle : undefined,
    isStudentCardVerified: existing?.isStudentCardVerified ?? Boolean(user?.studentIdVerified),
    currentFlatmates: existing?.currentFlatmates ?? [],
    totalHousemates: f.totalHousemates,
    genderPreference: f.genderPreference,
    femaleCount: f.femaleCount,
    maleCount: f.maleCount,
    occupantType: f.occupantType,
    smokingAllowed: f.smokingAllowed,
    petsAllowed: f.petsAllowed,
    heatingType: f.heatingType,
    hasAirConditioning: f.hasAirConditioning,
    hasWashingMachine: f.hasWashingMachine,
    hasWifi: f.hasWifi,
    hasBikeParking: f.hasBikeParking,
    bikeParkingDetails: f.hasBikeParking ? f.bikeParkingDetails.trim() || undefined : undefined,
    hasParking: f.hasParking,
    parkingDetails: f.hasParking ? f.parkingDetails.trim() || undefined : undefined,
    roomM2: Number(f.roomM2) || 0,
    apartmentM2: Number(f.apartmentM2) || 0,
    bathrooms: f.bathrooms,
    energyClass: f.energyClass || undefined,
    energyPerformance: isRatedEnergyClass(f.energyClass) && Number(f.energyPerformance) > 0 ? Math.round(Number(f.energyPerformance)) : undefined,
    floor: parseFloor(f.floor),
    // Asansör bilgisi yalnızca kat girildiyse anlamlıdır.
    hasElevator: parseFloor(f.floor) !== undefined ? f.hasElevator : undefined,
    floorPlanUrl: f.floorPlanUrl || undefined,
    confirmationTimeLeft: existing?.confirmationTimeLeft ?? '',
    description: f.description.trim() || existing?.description || '',
    userId: existing?.userId ?? user?.id,
    poster: existing?.poster ?? {
      id: user?.id,
      username: user?.username || 'ogrenci',
      name: user?.name || TRANSLATIONS[lang].defaultStudentName,
      avatar:
        user?.avatar ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=80',
      verifiedUniPD: Boolean(user?.studentIdVerified),
      department: user?.faculty || 'UniPD',
    },
    images: f.photos.map((p) => p.url),
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    views: existing?.views ?? 0,
  };
};

// ---------- Doğrulama ----------

/** Kiralık konutlarda depozito en fazla 3 aylık kira olabilir (Legge 392/1978, art. 11). */
export const DEPOSIT_MAX_MONTHS = 3;

/** Aylık kondominyum gideri üst sınırı (€); veritabanı kısıtıyla aynı olmalı. */
export const CONDO_FEES_MAX = 2000;

export type Errors = Partial<Record<string, string>>;

export const validateStep = (step: number, f: FormState, lang: Language): Errors => {
  const w = WIZARD_TEXT[lang];
  const e: Errors = {};
  if (step === 0) {
    if (!f.title.trim()) e.title = w.titleError;
  }
  if (step === 1) {
    if (!(Number(f.price) > 0)) e.price = w.rentError;
    if (!f.expensesIncluded && f.expensesAmount !== '' && !(Number(f.expensesAmount) >= 0)) e.expensesAmount = w.rentError;
    // Depozito isteğe bağlı; girilirse pozitif olmalı ve yasal sınırı (en fazla 3 aylık kira) aşmamalı.
    if (f.deposit.trim() !== '') {
      const d = Number(f.deposit);
      const rent = Number(f.price);
      if (!(d > 0)) e.deposit = TRANSLATIONS[lang].depositError;
      else if (rent > 0 && d > rent * DEPOSIT_MAX_MONTHS) {
        e.deposit = TRANSLATIONS[lang].depositTooHigh.replace('{max}', String(rent * DEPOSIT_MAX_MONTHS));
      }
    }
    // Kondominyum gideri isteğe bağlı; girilirse pozitif ve makul bir aylık tutar olmalı.
    if (f.condoFees.trim() !== '') {
      const c = Number(f.condoFees);
      if (!(c > 0) || c > CONDO_FEES_MAX) e.condoFees = TRANSLATIONS[lang].condoFeesError;
    }
    // Eski "Subentro" tipi artık seçilemez; asıl sözleşme tipi seçilmelidir.
    if (f.contractType === LEGACY_SUBENTRO_CONTRACT) e.contractType = TRANSLATIONS[lang].contractTypeRequired;
    // Devir ilanında ev sahibi onayı beyanı zorunlu.
    if (f.isSubentro && !f.landlordConsent) e.landlordConsent = TRANSLATIONS[lang].subentroAckError;
    // Süresiz ilan verilemez: başlangıç ve bitiş günü zorunlu.
    if (!f.startDate || !f.endDate) e.dates = w.datesRequired;
    else if (f.endDate <= f.startDate) e.dates = w.endBeforeStart;
    // 30 gün ve daha kısa kalışlar yayınlanamaz (turistik kiralama / CIN kapsamına girer).
    else if ((stayDays(f.startDate, f.endDate) ?? 0) < MIN_STAY_DAYS) e.dates = TRANSLATIONS[lang].minStayError;
    else if (termFromDates(f.startDate, f.endDate) === 'short' && !f.purposeAck) e.purposeAck = TRANSLATIONS[lang].purposeAckError;
  }
  if (step === 2) {
    if (!(Number(f.roomM2) > 0)) e.roomM2 = w.areaError;
    if (!(Number(f.apartmentM2) > 0)) e.apartmentM2 = w.areaError;
    // APE enerji sınıfı yasal olarak belirtilmelidir ('pending' seçeneği sertifikası olmayanlar içindir).
    if (!f.energyClass) e.energyClass = TRANSLATIONS[lang].energyClassError;
    // Enerji endeksi (EPgl / IPE) A4–G sınıflı konutlarda zorunludur (D.Lgs. 192/2005 art. 6: ilanda sınıfla birlikte yazılır);
    // sertifika bekleniyor / muaf / sınıflandırılamaz seçeneklerinde aranmaz. Ondalıksız ve makul aralıkta olmalı.
    if (isRatedEnergyClass(f.energyClass)) {
      if (f.energyPerformance.trim() === '') e.energyPerformance = TRANSLATIONS[lang].energyPerfRequired;
      else {
        const n = Number(f.energyPerformance);
        if (!Number.isInteger(n) || n < 1 || n > ENERGY_PERFORMANCE_MAX) e.energyPerformance = TRANSLATIONS[lang].energyPerfError;
      }
    }
    if (f.floor.trim() !== '') {
      const n = Number(f.floor);
      if (!Number.isFinite(n) || n < FLOOR_MIN || n > FLOOR_MAX) e.floor = TRANSLATIONS[lang].floorError;
    }
  }
  if (step === 3) {
    if (f.photos.length === 0) e.photos = w.photoError;
  }
  // Ev arkadaşı sayısı verildikten sonra herkesin cinsiyeti seçilmeli: kadın + erkek toplamı kişi sayısına eşit olmalı.
  if (step === 4) {
    if (f.femaleCount + f.maleCount !== f.totalHousemates) {
      e.distribution = TRANSLATIONS[lang].distributionIncomplete.replace('{n}', String(f.totalHousemates));
    }
  }
  return e;
};
