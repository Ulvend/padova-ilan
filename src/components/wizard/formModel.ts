import {
  ContractType,
  DistrictArea,
  HousingListing,
  Language,
  RoomType,
  UserProfile,
  VideoAngle,
} from '../../types';
import { DISTRICT_COORDINATES_MAP } from '../../data/mockData';
import { calculateNearestFaculty } from '../../services/geocodingService';
import { evaluateFairPrice } from '../../utils/fairPrice';
import { WIZARD_TEXT, LANG_LOCALE } from '../../utils/wizardText';

export type PhotoStatus = 'done' | 'uploading' | 'pending' | 'error';

export interface PhotoItem {
  id: string;
  url: string; // uzak URL ya da blob: önizleme
  status: PhotoStatus;
  progress: number;
  file?: File;
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
  contractType: ContractType;
  isImmediate: boolean;
  startDate: string;
  endDate: string;

  roomM2: string;
  apartmentM2: string;
  bathrooms: number;
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
    contractType: 'Contratto per Studenti (Canone Concordato)',
    isImmediate: false,
    startDate: todayISO(),
    endDate: '',
    roomM2: '',
    apartmentM2: '',
    bathrooms: 1,
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
  const name = n.landmarkName.split('(')[0].trim();
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
    contractType: l.contractType,
    isImmediate: !l.contractStartISO,
    startDate: l.contractStartISO || todayISO(),
    endDate: l.contractEndISO || '',
    roomM2: l.roomM2 ? String(l.roomM2) : '',
    apartmentM2: l.apartmentM2 ? String(l.apartmentM2) : '',
    bathrooms: l.bathrooms || 1,
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
  const fair = evaluateFairPrice(price, f.district, f.roomType);
  const videoAngles = f.hasVideoTour ? buildAngles(f) : undefined;
  const videoUrl = f.hasVideoTour ? f.videoUrl.trim() || undefined : undefined;
  const travel = travelEstimate(f.lat, f.lng, lang);
  const startISO = f.isImmediate ? '' : f.startDate;
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
    ...fair,
    roomType: f.roomType,
    contractType: f.contractType,
    contractStartDate: f.isImmediate ? undefined : formatDate(f.startDate, lang),
    contractStartISO: startISO,
    contractEndDate: f.endDate ? formatDate(f.endDate, lang) : undefined,
    contractEndISO: f.endDate || undefined,
    hasVideoTour: Boolean(f.hasVideoTour && (videoUrl || videoAngles?.length)),
    videoUrl,
    videoAngles,
    videoTitle: f.hasVideoTour ? existing?.videoTitle || w.videoTitle : undefined,
    isStudentCardVerified: existing?.isStudentCardVerified ?? Boolean(user?.studentIdVerified),
    compatibilityScore: existing?.compatibilityScore ?? 0,
    compatibilityReason: existing?.compatibilityReason ?? '',
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
    confirmationTimeLeft: existing?.confirmationTimeLeft ?? '3 Gün Teyitli: 72s Kaldı',
    description: f.description.trim() || existing?.description || '',
    userId: existing?.userId ?? user?.id,
    poster: existing?.poster ?? {
      id: user?.id,
      username: user?.username || 'ogrenci',
      name: user?.name || 'UniPD Öğrencisi',
      avatar:
        user?.avatar ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=80',
      verifiedUniPD: Boolean(user?.studentIdVerified),
      department: user?.faculty || 'UniPD',
      phone: user?.phone || undefined,
    },
    images: f.photos.map((p) => p.url),
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    views: existing?.views ?? 0,
  };
};

// ---------- Doğrulama ----------

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
    if (f.endDate && !f.isImmediate && f.startDate && f.endDate <= f.startDate) e.dates = w.endBeforeStart;
  }
  if (step === 2) {
    if (!(Number(f.roomM2) > 0)) e.roomM2 = w.areaError;
    if (!(Number(f.apartmentM2) > 0)) e.apartmentM2 = w.areaError;
  }
  if (step === 3) {
    if (f.photos.length === 0) e.photos = w.photoError;
  }
  return e;
};
