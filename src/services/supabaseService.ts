import { supabase, handleDbError, OperationType } from '../lib/supabase';
import { EnergyClass, HousingListing, UserProfile, FirestoreMessage, UserNotification, PosterInfo, Flatmate, VideoAngle, ListingRadar, Language } from '../types';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { defaultUsername } from '../utils/username';
import { setListingConfirmationDays } from '../config';
import { deleteListingPhotos } from './storageService';
import type { RadarInput } from '../utils/radar';

/**
 * 1. User Profile Management
 *
 * profiles          → herkese açık profil (giriş yapmış kullanıcılar okuyabilir)
 * profile_private    → e-posta, telefon, favoriler (yalnızca sahibi ve adminler)
 *
 * `unipd_verified` alanı istemciden gelir ama RLS bunun kullanıcının doğrulanmış
 * UniPD e-postasıyla eşleşmesini zorunlu tutar; yani sahte rozet yazılamaz.
 */
export interface PublicUserProfile {
  id: string;
  name: string;
  username: string;
  faculty: string;
  bio: string;
  photoURL: string;
  unipdVerified: boolean;
  createdAt?: string;
  updatedAt: string;
}

interface ProfileRow {
  id: string;
  name: string;
  username: string;
  faculty: string;
  bio: string;
  photo_url: string;
  unipd_verified: boolean;
  created_at: string;
  updated_at: string;
}

interface ProfilePrivateRow {
  user_id: string;
  email: string | null;
  phone: string | null;
  saved_listing_ids: string[] | null;
  updated_at: string;
}

const profileFromRow = (row: ProfileRow): PublicUserProfile => ({
  id: row.id,
  name: row.name,
  username: row.username,
  faculty: row.faculty,
  bio: row.bio,
  photoURL: row.photo_url,
  unipdVerified: row.unipd_verified,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// Postgres benzersizlik ihlali (profiles.username üzerindeki unique index).
const isUniqueViolation = (error: { code?: string } | null | undefined): boolean => error?.code === '23505';
// Sunucu kullanıcı adını biçim ya da ayrılmış ad kuralıyla reddetti (profiles_username_format).
const isUsernameRejected = (error: { code?: string; message?: string } | null | undefined): boolean =>
  error?.code === '23514' && /profiles_username_format/.test(error.message ?? '');

/** Kullanıcı adı boşta mı? Kayıt sırasında (oturum yokken) da çalışır. Ağ/sunucu hatasında fırlatır. */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_username_available', { p_username: username });
  if (error) throw error;
  return Boolean(data);
}

export interface AdminUserMatch {
  id: string;
  username: string | null;
  name: string | null;
  email: string | null;
  createdAt: string;
}

/** Yalnızca adminler: e-posta veya kullanıcı adıyla kullanıcı (ve UID) arar. Sunucu admin değilse reddeder. */
export async function adminFindUsers(search: string): Promise<AdminUserMatch[]> {
  const { data, error } = await supabase.rpc('admin_find_users', { search });
  if (error) throw error;
  return ((data ?? []) as { id: string; username: string | null; name: string | null; email: string | null; created_at: string }[]).map(
    (r) => ({ id: r.id, username: r.username, name: r.name, email: r.email, createdAt: r.created_at })
  );
}

/** Kullanıcı adını değiştirir; başkası almışsa 'taken' döner. */
export async function updateUsername(userId: string, username: string): Promise<'ok' | 'taken'> {
  const { error } = await supabase
    .from('profiles')
    .update({ username, updated_at: new Date().toISOString() })
    .eq('id', userId);
  if (isUniqueViolation(error) || isUsernameRejected(error)) return 'taken';
  if (error) throw error;
  return 'ok';
}

/**
 * Profili senkronize eder ve kaydedilen kullanıcı adını döner. İstenen ad bu arada başkasınca alındıysa
 * (kayıtta seçilen ad ile e-posta doğrulaması arasında) e-postadan bağımsız bir varsayılan ada düşer.
 */
export async function syncUserProfile(
  user: Partial<UserProfile> & { id: string },
  unipdVerified: boolean
): Promise<string> {
  const path = `profiles/${user.id}`;
  try {
    const { data: existing } = await supabase.from('profiles').select('created_at').eq('id', user.id).maybeSingle();

    let safePhotoURL = user.avatar || user.photoURL || '';
    if (safePhotoURL.startsWith('data:') || safePhotoURL.length > 2048) {
      console.warn('Base64 photo detected! Discarding.');
      safePhotoURL = '';
    }

    const now = new Date().toISOString();
    const upsertProfile = (username: string) =>
      supabase.from('profiles').upsert({
        id: user.id,
        name: (user.name || user.username || 'UniPD Student').slice(0, 100),
        username: username.slice(0, 50),
        faculty: (user.faculty || 'Università degli Studi di Padova').slice(0, 150),
        bio: (user.bio || '').slice(0, 500),
        photo_url: safePhotoURL,
        unipd_verified: unipdVerified,
        created_at: existing?.created_at || now,
        updated_at: now,
      });

    let savedUsername = user.username || defaultUsername(user.name || '', user.id);
    let { error: profileError } = await upsertProfile(savedUsername);
    if (isUniqueViolation(profileError) || isUsernameRejected(profileError)) {
      savedUsername = defaultUsername(user.name || '', user.id);
      ({ error: profileError } = await upsertProfile(savedUsername));
    }
    if (profileError) throw profileError;

    const { error: privateError } = await supabase.from('profile_private').upsert({
      user_id: user.id,
      email: user.email || '',
      phone: (user.phone || '').slice(0, 30),
      updated_at: now,
    });
    if (privateError) throw privateError;
    return savedUsername;
  } catch (error) {
    handleDbError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function updateUserProfilePhoto(userId: string, photoURL: string): Promise<void> {
  if (!photoURL.startsWith('https://')) {
    throw Object.assign(new Error('Invalid profile photo URL.'), { code: 'upload/bad-profile-url' });
  }
  const path = `profiles/${userId}`;
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ photo_url: photoURL, updated_at: new Date().toISOString() })
      .eq('id', userId);
    if (error) throw error;
  } catch (error) {
    handleDbError(error, OperationType.UPDATE, path);
  }
}

export async function getUserProfile(
  userId: string
): Promise<(PublicUserProfile & { email?: string; phone?: string; savedListingIds?: string[] }) | null> {
  const path = `profiles/${userId}`;
  try {
    const [{ data: publicRow }, { data: privateRow }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle<ProfileRow>(),
      supabase.from('profile_private').select('*').eq('user_id', userId).maybeSingle<ProfilePrivateRow>(),
    ]);
    if (!publicRow) return null;
    return {
      ...profileFromRow(publicRow),
      email: privateRow?.email || undefined,
      phone: privateRow?.phone || undefined,
      savedListingIds: privateRow?.saved_listing_ids || undefined,
    };
  } catch (error) {
    handleDbError(error, OperationType.GET, path);
    return null;
  }
}

export async function getPublicUserProfile(userId: string): Promise<PublicUserProfile | null> {
  try {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle<ProfileRow>();
    return data ? profileFromRow(data) : null;
  } catch (error) {
    console.warn(`Could not load profile profiles/${userId}:`, error);
    return null;
  }
}

export async function updateUserFavorites(userId: string, savedListingIds: string[]): Promise<void> {
  const path = `profile_private/${userId}`;
  try {
    const { error } = await supabase
      .from('profile_private')
      .upsert({ user_id: userId, saved_listing_ids: savedListingIds, updated_at: new Date().toISOString() });
    if (error) throw error;
  } catch (error) {
    handleDbError(error, OperationType.UPDATE, path);
  }
}

// Admin paneli için: UniPD doğrulaması geçmiş kullanıcılar.
export function subscribeToVerifiedUsers(onUpdate: (users: PublicUserProfile[]) => void): () => void {
  const load = async () => {
    const { data, error } = await supabase.from('profiles').select('*').eq('unipd_verified', true);
    if (error) {
      console.warn('Verified users subscription error:', error);
      return;
    }
    onUpdate((data as ProfileRow[]).map(profileFromRow));
  };
  load();
  const channel = supabase
    .channel('verified-users')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, load)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * 2. Admin Yetkileri: admins/{userId}
 * Yalnızca ana admin yazabilir (RLS). Satırın varlığı admin olmak demektir.
 */
export type AdminRole = 'admin' | 'superadmin';

export interface AdminGrant {
  uid: string;
  note?: string;
  grantedBy: string;
  createdAt: string;
  role: AdminRole;
}

interface AdminRow {
  uid: string;
  note: string | null;
  granted_by: string;
  created_at: string;
  role: AdminRole;
}

/** Kullanıcının admin rolünü izler; admins tablosunda satırı yoksa null. */
export function subscribeToAdminStatus(userId: string, onUpdate: (role: AdminRole | null) => void): () => void {
  const load = async () => {
    const { data, error } = await supabase.from('admins').select('role').eq('uid', userId).maybeSingle();
    onUpdate(error || !data ? null : ((data as { role: AdminRole }).role));
  };
  load();
  const channel = supabase
    .channel(`admin-status-${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'admins', filter: `uid=eq.${userId}` }, load)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToAdminGrants(onUpdate: (grants: AdminGrant[]) => void): () => void {
  const load = async () => {
    const { data, error } = await supabase.from('admins').select('*');
    if (error) {
      console.warn('Admin grants subscription error:', error);
      return;
    }
    onUpdate(
      (data as AdminRow[]).map((r) => ({
        uid: r.uid,
        note: r.note || undefined,
        grantedBy: r.granted_by,
        createdAt: r.created_at,
        role: r.role,
      }))
    );
  };
  load();
  const channel = supabase
    .channel('admin-grants')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'admins' }, load)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

export async function grantAdmin(uid: string, grantedBy: string, note?: string): Promise<void> {
  const path = `admins/${uid}`;
  try {
    const { error } = await supabase.from('admins').upsert({
      uid,
      note: (note || '').slice(0, 200),
      granted_by: grantedBy,
      created_at: new Date().toISOString(),
    });
    if (error) throw error;
  } catch (error) {
    handleDbError(error, OperationType.WRITE, path);
  }
}

export async function revokeAdmin(uid: string): Promise<void> {
  const path = `admins/${uid}`;
  try {
    const { error } = await supabase.from('admins').delete().eq('uid', uid);
    if (error) throw error;
  } catch (error) {
    handleDbError(error, OperationType.DELETE, path);
  }
}

/**
 * 3. Housing Listings Management: listings
 */
interface ListingRow {
  id: string;
  user_id: string | null;
  title: string;
  district: string;
  street_address: string;
  distance_to_faculty: string;
  price: number;
  expenses: string;
  deposit: number | null;
  condo_fees: number | null;
  fair_price_status: string;
  fair_price_text: string;
  room_type: string;
  contract_type: string;
  contract_start_date: string | null;
  contract_start_iso: string | null;
  contract_end_date: string | null;
  contract_end_iso: string | null;
  has_video_tour: boolean;
  video_title: string | null;
  video_url: string | null;
  video_angles: VideoAngle[] | null;
  is_student_card_verified: boolean;
  current_flatmates: Flatmate[] | null;
  total_housemates: number | null;
  gender_preference: string | null;
  female_count: number | null;
  male_count: number | null;
  occupant_type: string | null;
  smoking_allowed: boolean | null;
  pets_allowed: boolean | null;
  heating_type: string | null;
  has_air_conditioning: boolean | null;
  has_washing_machine: boolean | null;
  has_wifi: boolean | null;
  has_bike_parking: boolean | null;
  bike_parking_details: string | null;
  has_parking: boolean | null;
  parking_details: string | null;
  room_m2: number;
  apartment_m2: number;
  bathrooms: number;
  energy_class: EnergyClass | null;
  energy_performance: number | null;
  floor: number | null;
  has_elevator: boolean | null;
  floor_plan_url: string | null;
  confirmation_time_left: string;
  description: string;
  poster: PosterInfo;
  images: string[];
  created_at: string;
  confirmed_at: string | null;
  updated_at: string | null;
  views: number;
  lat: number | null;
  lng: number | null;
  is_archived: boolean;
  rented_at: string | null;
  rented_price: number | null;
  archive_reason: string | null;
  tenant_type: string | null;
}

const listingFromRow = (row: ListingRow): HousingListing => ({
  id: row.id,
  userId: row.user_id || undefined,
  title: row.title,
  district: row.district as HousingListing['district'],
  streetAddress: row.street_address,
  distanceToFaculty: row.distance_to_faculty,
  price: row.price,
  expenses: row.expenses,
  deposit: row.deposit ?? undefined,
  condoFees: row.condo_fees ?? undefined,
  fairPriceStatus: row.fair_price_status as HousingListing['fairPriceStatus'],
  fairPriceText: row.fair_price_text,
  roomType: row.room_type as HousingListing['roomType'],
  contractType: row.contract_type as HousingListing['contractType'],
  contractStartDate: row.contract_start_date || undefined,
  contractStartISO: row.contract_start_iso || undefined,
  contractEndDate: row.contract_end_date || undefined,
  contractEndISO: row.contract_end_iso || undefined,
  hasVideoTour: row.has_video_tour,
  videoTitle: row.video_title || undefined,
  videoUrl: row.video_url || undefined,
  videoAngles: row.video_angles || undefined,
  isStudentCardVerified: row.is_student_card_verified,
  currentFlatmates: row.current_flatmates || [],
  totalHousemates: row.total_housemates || undefined,
  genderPreference: (row.gender_preference as HousingListing['genderPreference']) || undefined,
  femaleCount: row.female_count ?? undefined,
  maleCount: row.male_count ?? undefined,
  occupantType: (row.occupant_type as HousingListing['occupantType']) || undefined,
  smokingAllowed: row.smoking_allowed ?? undefined,
  petsAllowed: row.pets_allowed ?? undefined,
  heatingType: (row.heating_type as HousingListing['heatingType']) || undefined,
  hasAirConditioning: row.has_air_conditioning ?? undefined,
  hasWashingMachine: row.has_washing_machine ?? undefined,
  hasWifi: row.has_wifi ?? undefined,
  hasBikeParking: row.has_bike_parking ?? undefined,
  bikeParkingDetails: row.bike_parking_details || undefined,
  hasParking: row.has_parking ?? undefined,
  parkingDetails: row.parking_details || undefined,
  roomM2: row.room_m2,
  apartmentM2: row.apartment_m2,
  bathrooms: row.bathrooms,
  energyClass: row.energy_class || undefined,
  energyPerformance: row.energy_performance ?? undefined,
  floor: row.floor ?? undefined,
  hasElevator: row.has_elevator ?? undefined,
  floorPlanUrl: row.floor_plan_url || undefined,
  confirmationTimeLeft: row.confirmation_time_left,
  description: row.description,
  poster: row.poster,
  images: row.images || [],
  createdAt: row.created_at,
  confirmedAt: row.confirmed_at || undefined,
  updatedAt: row.updated_at || undefined,
  views: row.views,
  lat: row.lat ?? undefined,
  lng: row.lng ?? undefined,
  isArchived: row.is_archived,
  rentedAt: row.rented_at || undefined,
  rentedPrice: row.rented_price ?? undefined,
  archiveReason: row.archive_reason || undefined,
  tenantType: row.tenant_type || undefined,
});

// camelCase listing alanlarını snake_case DB sütunlarına çevirir (kısmi güncellemeler dahil).
const listingToRow = (listing: Partial<HousingListing>): Record<string, unknown> => {
  const row: Record<string, unknown> = {};
  const map: Record<string, string> = {
    userId: 'user_id',
    title: 'title',
    district: 'district',
    streetAddress: 'street_address',
    distanceToFaculty: 'distance_to_faculty',
    price: 'price',
    expenses: 'expenses',
    deposit: 'deposit',
    condoFees: 'condo_fees',
    fairPriceStatus: 'fair_price_status',
    fairPriceText: 'fair_price_text',
    roomType: 'room_type',
    contractType: 'contract_type',
    contractStartDate: 'contract_start_date',
    contractStartISO: 'contract_start_iso',
    contractEndDate: 'contract_end_date',
    contractEndISO: 'contract_end_iso',
    hasVideoTour: 'has_video_tour',
    videoTitle: 'video_title',
    videoUrl: 'video_url',
    videoAngles: 'video_angles',
    isStudentCardVerified: 'is_student_card_verified',
    currentFlatmates: 'current_flatmates',
    totalHousemates: 'total_housemates',
    genderPreference: 'gender_preference',
    femaleCount: 'female_count',
    maleCount: 'male_count',
    occupantType: 'occupant_type',
    smokingAllowed: 'smoking_allowed',
    petsAllowed: 'pets_allowed',
    heatingType: 'heating_type',
    hasAirConditioning: 'has_air_conditioning',
    hasWashingMachine: 'has_washing_machine',
    hasWifi: 'has_wifi',
    hasBikeParking: 'has_bike_parking',
    bikeParkingDetails: 'bike_parking_details',
    hasParking: 'has_parking',
    parkingDetails: 'parking_details',
    roomM2: 'room_m2',
    apartmentM2: 'apartment_m2',
    bathrooms: 'bathrooms',
    energyClass: 'energy_class',
    energyPerformance: 'energy_performance',
    floor: 'floor',
    hasElevator: 'has_elevator',
    floorPlanUrl: 'floor_plan_url',
    confirmationTimeLeft: 'confirmation_time_left',
    description: 'description',
    poster: 'poster',
    images: 'images',
    views: 'views',
    confirmedAt: 'confirmed_at',
    lat: 'lat',
    lng: 'lng',
    isArchived: 'is_archived',
    rentedAt: 'rented_at',
    rentedPrice: 'rented_price',
    archiveReason: 'archive_reason',
    tenantType: 'tenant_type',
  };
  Object.entries(listing).forEach(([key, value]) => {
    if (key === 'id' || key === 'createdAt' || key === 'updatedAt') return;
    const column = map[key];
    // Depozito, kondominyum gideri ve enerji endeksi düzenlemede silinebilsin diye tanımsız değer null olarak yazılır.
    if (column) row[column] = key === 'deposit' || key === 'condoFees' || key === 'energyPerformance' ? value ?? null : value;
  });
  return row;
};

export async function saveListingToFirestore(listing: HousingListing, userId: string): Promise<void> {
  const path = `listings/${listing.id}`;
  try {
    const now = new Date().toISOString();
    const { error } = await supabase.from('listings').insert({
      id: listing.id,
      ...listingToRow(listing),
      user_id: userId,
      created_at: now,
      updated_at: now,
    });
    if (error) throw error;
  } catch (error) {
    handleDbError(error, OperationType.WRITE, path);
  }
}

export async function updateListingInFirestore(
  listingId: string,
  updates: Partial<HousingListing>,
  fieldsToRemove: (keyof HousingListing)[] = []
): Promise<void> {
  const path = `listings/${listingId}`;
  try {
    const payload: Record<string, unknown> = {
      ...listingToRow(updates),
      updated_at: new Date().toISOString(),
    };
    // fieldsToRemove alanlarını null'a çeker (Firestore'daki deleteField() karşılığı).
    fieldsToRemove.forEach((field) => {
      const column = listingToRow({ [field]: null } as Partial<HousingListing>);
      Object.keys(column).forEach((c) => (payload[c] = null));
    });
    const { error } = await supabase.from('listings').update(payload).eq('id', listingId);
    if (error) throw error;
  } catch (error) {
    handleDbError(error, OperationType.UPDATE, path);
  }
}

export async function deleteListingFromFirestore(listing: HousingListing): Promise<void> {
  const path = `listings/${listing.id}`;
  try {
    const { error } = await supabase.from('listings').delete().eq('id', listing.id);
    if (error) throw error;
  } catch (error) {
    handleDbError(error, OperationType.DELETE, path);
  }
  await deleteListingPhotos([...(listing.images || []), ...(listing.floorPlanUrl ? [listing.floorPlanUrl] : [])]);
}

// PostgREST bir yanıtta en fazla 1000 satır döndürür (Supabase varsayılanı); daha fazlası sayfa sayfa çekilir.
// Proje ayarlarında "Max rows" düşürülürse PAGE_SIZE de o değere çekilmelidir.
const PAGE_SIZE = 1000;
// Aynı kısa aralıktaki gerçek zamanlı olaylar tek bir "değişen satırları çek" isteğinde toplanır.
const SYNC_DEBOUNCE_MS = 200;
// Kanal bu sürede bağlanamazsa ilk yükleme yine de yapılır.
const SYNC_CONNECT_FALLBACK_MS = 3000;
const IDS_PER_REQUEST = 100;

type SyncResult<Row> = PromiseLike<{ data: Row[] | null; error: unknown }>;

interface TableSyncOptions<Row extends { id: string }, Item extends { id: string }> {
  channelName: string;
  table: string;
  /** Sıralı sayfa: from..to (dahil). Sıralama benzersiz olmalı (ör. created_at, id). */
  fetchPage: (from: number, to: number) => SyncResult<Row>;
  fetchByIds: (ids: string[]) => SyncResult<Row>;
  map: (row: Row) => Item;
  compare: (a: Item, b: Item) => number;
  onUpdate: (items: Item[]) => void;
  onError?: (error: unknown) => void;
}

/**
 * Bir tabloyu istemcide senkron tutar: ilk yüklemede tüm satırlar sayfalanarak çekilir, sonrasında
 * gerçek zamanlı olaylarda yalnızca değişen satırlar (silinenler için hiç istek atılmadan) güncellenir.
 * Kanal yeniden bağlandığında kaçırılmış olaylar için baştan yüklenir.
 */
function syncTable<Row extends { id: string }, Item extends { id: string }>(
  o: TableSyncOptions<Row, Item>
): () => void {
  const items = new Map<string, Item>();
  const dirty = new Set<string>();
  const gone = new Set<string>();
  let disposed = false;
  let loadRequested = false;
  let flushTimer: ReturnType<typeof setTimeout> | undefined;
  // Yükleme ve tekil güncellemeler sırayla çalışır; böylece birbirinin üzerine yazmaz.
  let chain: Promise<void> = Promise.resolve();
  const enqueue = (task: () => Promise<void>) => {
    chain = chain.then(task).catch((error) => console.warn(`${o.table} sync error:`, error));
  };

  const emit = () => {
    if (!disposed) o.onUpdate([...items.values()].sort(o.compare));
  };

  const reload = async () => {
    if (disposed) return;
    try {
      const rows: Row[] = [];
      for (let from = 0; ; from += PAGE_SIZE) {
        const { data, error } = await o.fetchPage(from, from + PAGE_SIZE - 1);
        if (error) throw error;
        rows.push(...(data ?? []));
        if (!data || data.length < PAGE_SIZE) break;
      }
      items.clear();
      rows.forEach((row) => items.set(row.id, o.map(row)));
      emit();
    } catch (error) {
      console.warn(`${o.table} subscription error:`, error);
      if (!disposed) o.onError?.(error);
    }
  };

  const flush = async () => {
    if (disposed) return;
    const removedIds = [...gone];
    const changedIds = [...dirty];
    gone.clear();
    dirty.clear();
    let changed = removedIds.reduce((any, id) => items.delete(id) || any, false);
    try {
      for (let i = 0; i < changedIds.length; i += IDS_PER_REQUEST) {
        const chunk = changedIds.slice(i, i + IDS_PER_REQUEST);
        const { data, error } = await o.fetchByIds(chunk);
        if (error) throw error;
        const found = new Set<string>();
        (data ?? []).forEach((row) => {
          items.set(row.id, o.map(row));
          found.add(row.id);
        });
        // Artık okunamayan (silinmiş ya da görünürlüğü kalkmış) satırlar listeden çıkar.
        chunk.forEach((id) => {
          if (!found.has(id)) items.delete(id);
        });
        changed = true;
      }
    } catch (error) {
      console.warn(`${o.table} incremental sync failed, reloading:`, error);
      await reload();
      return;
    }
    if (changed) emit();
  };

  const requestLoad = () => {
    loadRequested = true;
    enqueue(reload);
  };

  const scheduleFlush = () => {
    if (flushTimer) return;
    flushTimer = setTimeout(() => {
      flushTimer = undefined;
      enqueue(flush);
    }, SYNC_DEBOUNCE_MS);
  };

  const channel = supabase
    .channel(o.channelName)
    .on('postgres_changes', { event: '*', schema: 'public', table: o.table }, (payload) => {
      const row = (payload.eventType === 'DELETE' ? payload.old : payload.new) as { id?: string } | undefined;
      if (!row?.id) {
        requestLoad();
        return;
      }
      if (payload.eventType === 'DELETE') {
        dirty.delete(row.id);
        gone.add(row.id);
      } else {
        gone.delete(row.id);
        dirty.add(row.id);
      }
      scheduleFlush();
    })
    // Her (yeniden) bağlanışta baştan yükle: abonelikten önce ya da bağlantı kopukken olan değişiklikler kaçmasın.
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') requestLoad();
    });
  // Gerçek zamanlı kanal hiç bağlanamazsa liste yine de yüklenir.
  const fallbackTimer = setTimeout(() => {
    if (!loadRequested) requestLoad();
  }, SYNC_CONNECT_FALLBACK_MS);

  return () => {
    disposed = true;
    clearTimeout(fallbackTimer);
    if (flushTimer) clearTimeout(flushTimer);
    supabase.removeChannel(channel);
  };
}

// Teyit süresi sunucudaki public.listing_confirmation_days() fonksiyonundan okunur (tek kaynak).
// Okunamazsa src/config.ts'deki varsayılan kullanılır.
let confirmationDaysLoaded: Promise<void> | null = null;
const loadConfirmationDays = (): Promise<void> => {
  confirmationDaysLoaded ??= (async () => {
    const { data, error } = await supabase.rpc('listing_confirmation_days');
    if (!error && typeof data === 'number') setListingConfirmationDays(data);
  })().catch(() => undefined);
  return confirmationDaysLoaded;
};

export function subscribeToListings(
  onUpdate: (listings: HousingListing[]) => void,
  onError?: (error: unknown) => void
): () => void {
  return syncTable<ListingRow, HousingListing>({
    channelName: 'listings-all',
    table: 'listings',
    fetchPage: async (from, to) => {
      // İlk sayfa istenirken süre de okunur; ilanlar arayüze ulaştığında süre hazır olur.
      const [, page] = await Promise.all([
        from === 0 ? loadConfirmationDays() : undefined,
        supabase.from('listings').select('*').order('created_at', { ascending: true }).order('id').range(from, to),
      ]);
      return page as { data: ListingRow[] | null; error: unknown };
    },
    fetchByIds: (ids) => supabase.from('listings').select('*').in('id', ids) as SyncResult<ListingRow>,
    map: listingFromRow,
    // Eskiden yeniye: yeni ilanlar sona eklenir, mevcut ilanların sırası (ve koordinat yedeği) değişmez.
    compare: (a, b) => (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : a.id < b.id ? -1 : 1),
    onUpdate,
    onError,
  });
}

/**
 * 4. Direct Messages Management: messages
 * Her mesaj iki katılımcı içerir; kullanıcı yalnızca dahil olduğu mesajları okuyabilir.
 */
// Hesabı silinen kullanıcının mesajlarında sender_id/recipient_id boşalır (karşı tarafın kayıtları korunur).
export const DELETED_USER_ID = 'deleted-account';

interface MessageRow {
  id: string;
  sender_id: string | null;
  recipient_id: string | null;
  text: string;
  listing_id: string | null;
  subject: string | null;
  read: boolean;
  created_at: number;
}

const messageFromRow = (row: MessageRow): FirestoreMessage => ({
  id: row.id,
  senderId: row.sender_id ?? DELETED_USER_ID,
  recipientId: row.recipient_id ?? DELETED_USER_ID,
  participants: [row.sender_id ?? DELETED_USER_ID, row.recipient_id ?? DELETED_USER_ID],
  text: row.text,
  listingId: row.listing_id || undefined,
  subject: row.subject || undefined,
  read: row.read,
  createdAt: row.created_at,
});

export function subscribeToMessages(
  userId: string,
  onUpdate: (messages: FirestoreMessage[]) => void,
  onError?: (error: unknown) => void
): () => void {
  const mine = `sender_id.eq.${userId},recipient_id.eq.${userId}`;
  return syncTable<MessageRow, FirestoreMessage>({
    channelName: `messages-${userId}`,
    table: 'messages',
    fetchPage: (from, to) =>
      supabase
        .from('messages')
        .select('*')
        .or(mine)
        .order('created_at', { ascending: true })
        .order('id')
        .range(from, to) as SyncResult<MessageRow>,
    fetchByIds: (ids) => supabase.from('messages').select('*').or(mine).in('id', ids) as SyncResult<MessageRow>,
    map: messageFromRow,
    compare: (a, b) => a.createdAt - b.createdAt || (a.id < b.id ? -1 : 1),
    onUpdate,
    onError,
  });
}

export async function sendMessageToFirestore(
  message: Omit<FirestoreMessage, 'id' | 'participants' | 'read' | 'createdAt'>
): Promise<void> {
  const path = 'messages';
  try {
    const { error } = await supabase.from('messages').insert({
      sender_id: message.senderId,
      recipient_id: message.recipientId,
      text: message.text.slice(0, 2000),
      listing_id: message.listingId,
      subject: message.subject?.slice(0, 200),
      read: false,
      // Yalnızca yedek: sunucu tetikleyicisi bu değeri sunucu saatiyle ezer (cihaz saati sıralamayı etkilemez).
      created_at: Date.now(),
    });
    if (error) throw error;
  } catch (error) {
    handleDbError(error, OperationType.WRITE, path);
  }
}

export async function markMessagesRead(messageIds: string[]): Promise<void> {
  if (messageIds.length === 0) return;
  try {
    const { error } = await supabase.from('messages').update({ read: true }).in('id', messageIds);
    if (error) throw error;
  } catch (error) {
    handleDbError(error, OperationType.UPDATE, 'messages');
  }
}

/**
 * 5. User Notifications Management: notifications
 * Kullanıcı yalnızca kendine bildirim yazabilir; adminler ilan sahiplerine yazabilir.
 */
interface NotificationRow {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: UserNotification['type'];
  read: boolean;
  created_at: string;
  timestamp: number;
  link_view: string | null;
  link_id: string | null;
}

const notificationFromRow = (row: NotificationRow): UserNotification => ({
  id: row.id,
  userId: row.user_id,
  title: row.title,
  message: row.message,
  type: row.type,
  read: row.read,
  createdAt: row.created_at,
  timestamp: row.timestamp,
  linkView: (row.link_view as UserNotification['linkView']) || undefined,
  linkId: row.link_id || undefined,
});

export function subscribeToNotifications(
  userId: string,
  onUpdate: (notifications: UserNotification[]) => void
): () => void {
  const load = async () => {
    const { data, error } = await supabase.from('notifications').select('*').eq('user_id', userId);
    if (error) {
      console.warn('Notifications subscription error:', error);
      return;
    }
    const items = (data as NotificationRow[]).map(notificationFromRow);
    items.sort((a, b) => b.timestamp - a.timestamp);
    onUpdate(items);
  };
  load();
  const channel = supabase
    .channel(`notifications-${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, load)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

export async function saveNotificationToFirestore(
  notification: Omit<UserNotification, 'id' | 'read' | 'timestamp'>
): Promise<void> {
  const path = 'notifications';
  try {
    const { error } = await supabase.from('notifications').insert({
      user_id: notification.userId,
      title: notification.title.slice(0, 120),
      message: notification.message.slice(0, 500),
      type: notification.type,
      created_at: notification.createdAt,
      link_view: notification.linkView,
      link_id: notification.linkId,
      read: false,
      timestamp: Date.now(),
    });
    if (error) throw error;
  } catch (error) {
    handleDbError(error, OperationType.WRITE, path);
  }
}

export async function markNotificationsRead(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  try {
    const { error } = await supabase.from('notifications').update({ read: true }).in('id', ids);
    if (error) throw error;
  } catch (error) {
    handleDbError(error, OperationType.UPDATE, 'notifications');
  }
}

export async function deleteNotificationFromFirestore(id: string): Promise<void> {
  try {
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (error) throw error;
  } catch (error) {
    handleDbError(error, OperationType.DELETE, `notifications/${id}`);
  }
}

export async function deleteNotifications(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  try {
    const { error } = await supabase.from('notifications').delete().in('id', ids);
    if (error) throw error;
  } catch (error) {
    handleDbError(error, OperationType.DELETE, 'notifications');
  }
}

export type { RealtimeChannel };

/**
 * Görüntülenme sayacı. Sayaç listings tablosundan ayrıdır (her artış tüm istemcilerde liste yenilemesi
 * tetiklemesin diye); sunucu ilan sahibinin kendi görüntülemesini ve arşivli ilanları saymaz.
 */
export async function recordListingView(listingId: string): Promise<void> {
  const { error } = await supabase.rpc('record_listing_view', { p_listing_id: listingId });
  if (error) console.warn('Could not record listing view:', error);
}

/** İlan sahibi için ilan başına favoriye eklenme sayısı (yalnızca sayı; kimin eklediği gösterilmez). */
export async function getListingFavoriteCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase.rpc('listing_favorite_counts');
  if (error) {
    console.warn('Could not load listing favorite counts:', error);
    return {};
  }
  return Object.fromEntries(
    (data as { listing_id: string; favorites: number | string }[]).map((r) => [r.listing_id, Number(r.favorites)])
  );
}

/** İlan sahibi (ve admin) için ilan başına görüntülenme sayıları. */
export async function getListingViewCounts(listingIds: string[]): Promise<Record<string, number>> {
  if (listingIds.length === 0) return {};
  const { data, error } = await supabase.from('listing_stats').select('listing_id, views').in('listing_id', listingIds);
  if (error) {
    console.warn('Could not load listing view counts:', error);
    return {};
  }
  return Object.fromEntries((data as { listing_id: string; views: number }[]).map((r) => [r.listing_id, r.views]));
}

/**
 * Şikayetler (reports): kullanıcılar ilan/kullanıcı bildirir, yalnızca yöneticiler okur ve yönetir (RLS).
 */
export type ReportCategory = 'scam' | 'fake_photo' | 'inappropriate' | 'spam' | 'other';
export type ReportStatus = 'pending' | 'reviewed' | 'dismissed';

export interface Report {
  id: string;
  reporterId: string;
  targetListingId?: string;
  targetListingTitle?: string;
  // Şikayet edilen ilanın sahibi (ilan silinmişse bilinmez).
  targetListingOwnerId?: string;
  targetUserId?: string;
  category: ReportCategory;
  reason: string;
  status: ReportStatus;
  createdAt: string;
  reviewedAt?: string;
}

interface ReportRow {
  id: string;
  reporter_id: string;
  target_listing_id: string | null;
  target_user_id: string | null;
  category: ReportCategory;
  reason: string;
  status: ReportStatus;
  created_at: string;
  reviewed_at: string | null;
  listings?: { title: string; user_id: string | null } | null;
}

/** Bir ilanı bildirir. Aynı ilan için bekleyen şikayet varsa 'duplicate' döner. */
export async function submitListingReport(input: {
  reporterId: string;
  listingId: string;
  category: ReportCategory;
  reason: string;
}): Promise<'ok' | 'duplicate'> {
  const { error } = await supabase.from('reports').insert({
    reporter_id: input.reporterId,
    target_listing_id: input.listingId,
    category: input.category,
    reason: input.reason.trim().slice(0, 500),
  });
  if (!error) return 'ok';
  if (error.code === '23505') return 'duplicate';
  throw error;
}

/** Yöneticiler için tüm şikayetler (en yeni önce), ilan başlığıyla birlikte. */
export async function getReports(): Promise<Report[]> {
  const { data, error } = await supabase
    .from('reports')
    .select('*, listings(title, user_id)')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) {
    console.warn('Could not load reports:', error);
    return [];
  }
  return (data as ReportRow[]).map((r) => ({
    id: r.id,
    reporterId: r.reporter_id,
    targetListingId: r.target_listing_id ?? undefined,
    targetListingTitle: r.listings?.title,
    targetListingOwnerId: r.listings?.user_id ?? undefined,
    targetUserId: r.target_user_id ?? undefined,
    category: r.category,
    reason: r.reason,
    status: r.status,
    createdAt: r.created_at,
    reviewedAt: r.reviewed_at ?? undefined,
  }));
}

export async function updateReportStatus(id: string, status: ReportStatus): Promise<void> {
  const { error } = await supabase.from('reports').update({ status }).eq('id', id);
  if (error) throw error;
}

// ---------- Kullanıcı banlama (yalnızca yöneticiler; kurallar 0015_user_bans.sql'de) ----------

export type BanResult = 'ok' | 'cannot_ban_admin' | 'cannot_ban_self';

/**
 * Kullanıcıyı banlar: girişi engellenir, yayındaki ilanları arşivlenir, ilgili bekleyen şikayetler
 * incelendi sayılır. Yöneticiler ve kişinin kendisi banlanamaz.
 */
export async function adminBanUser(userId: string, reason: string, reportId?: string): Promise<BanResult> {
  const { error } = await supabase.rpc('admin_ban_user', { p_user_id: userId, p_reason: reason, p_report_id: reportId ?? null });
  if (!error) return 'ok';
  if (/cannot_ban_admin/.test(error.message)) return 'cannot_ban_admin';
  if (/cannot_ban_self/.test(error.message)) return 'cannot_ban_self';
  throw error;
}

export async function adminUnbanUser(userId: string): Promise<void> {
  const { error } = await supabase.rpc('admin_unban_user', { p_user_id: userId });
  if (error) throw error;
}

export interface BannedUser {
  userId: string;
  name?: string;
  username?: string;
  reason: string;
  createdAt: string;
}

/** Yöneticiler için banlı kullanıcılar (en yeni ban önce), profil adlarıyla. */
export async function getBannedUsers(): Promise<BannedUser[]> {
  const { data, error } = await supabase
    .from('banned_users')
    .select('user_id, reason, created_at')
    .order('created_at', { ascending: false });
  if (error) {
    console.warn('Could not load banned users:', error);
    return [];
  }
  const rows = data as { user_id: string; reason: string; created_at: string }[];
  // banned_users auth.users'a bağlı olduğu için profiller ayrı sorguyla eşlenir.
  const profiles = new Map<string, { name: string; username: string }>();
  if (rows.length > 0) {
    const { data: profileRows } = await supabase
      .from('profiles')
      .select('id, name, username')
      .in('id', rows.map((r) => r.user_id));
    for (const p of (profileRows ?? []) as { id: string; name: string; username: string }[]) profiles.set(p.id, p);
  }
  return rows.map((r) => ({
    userId: r.user_id,
    name: profiles.get(r.user_id)?.name,
    username: profiles.get(r.user_id)?.username,
    reason: r.reason,
    createdAt: r.created_at,
  }));
}

export type PhotoFlagStatus = 'pending' | 'reviewed' | 'dismissed';

export interface PhotoDuplicateFlag {
  id: number;
  createdAt: string;
  status: PhotoFlagStatus;
  /** 64 bitlik özette kaç bit fark var (0 = aynı, en fazla 6). */
  distance: number;
  /** Yeni yüklenen fotoğraf ve yükleyen. */
  url: string;
  ownerId: string;
  ownerName?: string;
  ownerUsername?: string;
  /** Daha önce yüklenmiş, benzeyen fotoğraf ve sahibi. */
  matchedUrl: string;
  matchedOwnerId: string;
  matchedOwnerName?: string;
  matchedOwnerUsername?: string;
}

interface PhotoFlagRow {
  id: number;
  created_at: string;
  status: PhotoFlagStatus;
  distance: number;
  path: string;
  owner_id: string;
  matched_path: string;
  matched_owner_id: string;
}

const listingPhotoUrl = (path: string): string => supabase.storage.from('listing_photos').getPublicUrl(path).data.publicUrl;

/** Yöneticiler için başka kullanıcının fotoğrafına benzeyen yüklemeler (en yeni önce). RLS: yalnızca adminler okur. */
export async function getPhotoDuplicateFlags(status: PhotoFlagStatus = 'pending'): Promise<PhotoDuplicateFlag[]> {
  const { data, error } = await supabase
    .from('photo_duplicate_flags')
    .select('id, created_at, status, distance, path, owner_id, matched_path, matched_owner_id')
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) {
    console.warn('Could not load photo duplicate flags:', error);
    return [];
  }
  const rows = data as PhotoFlagRow[];
  const ids = new Set<string>();
  rows.forEach((r) => {
    ids.add(r.owner_id);
    ids.add(r.matched_owner_id);
  });
  const profiles = new Map<string, { name: string; username: string }>();
  if (ids.size > 0) {
    const { data: profileRows } = await supabase.from('profiles').select('id, name, username').in('id', [...ids]);
    for (const p of (profileRows ?? []) as { id: string; name: string; username: string }[]) profiles.set(p.id, p);
  }
  return rows.map((r) => ({
    id: r.id,
    createdAt: r.created_at,
    status: r.status,
    distance: r.distance,
    url: listingPhotoUrl(r.path),
    ownerId: r.owner_id,
    ownerName: profiles.get(r.owner_id)?.name,
    ownerUsername: profiles.get(r.owner_id)?.username,
    matchedUrl: listingPhotoUrl(r.matched_path),
    matchedOwnerId: r.matched_owner_id,
    matchedOwnerName: profiles.get(r.matched_owner_id)?.name,
    matchedOwnerUsername: profiles.get(r.matched_owner_id)?.username,
  }));
}

export async function updatePhotoFlagStatus(id: number, status: PhotoFlagStatus): Promise<void> {
  const { error } = await supabase.from('photo_duplicate_flags').update({ status }).eq('id', id);
  if (error) throw error;
}

export type AuditAction =
  | 'admin_granted'
  | 'admin_revoked'
  | 'user_banned'
  | 'user_unbanned'
  | 'listing_deleted'
  | 'listing_updated'
  | 'report_status_changed'
  | 'photo_flag_reviewed';

export interface AuditLogEntry {
  id: number;
  createdAt: string;
  actorId?: string;
  actorName?: string;
  actorUsername?: string;
  action: AuditAction | string;
  targetType: string;
  targetId?: string;
  targetName?: string;
  targetUsername?: string;
  details: Record<string, unknown>;
}

interface AuditLogRow {
  id: number;
  created_at: string;
  actor_id: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  details: Record<string, unknown> | null;
}

/**
 * Admin işlem kaydı (yalnızca superadmin okuyabilir; RLS diğerlerine boş döner). En yeni önce;
 * `beforeId` verilirse ondan eski kayıtlar gelir. Kişi adları profillerden ayrıca eşlenir (silinmiş hesaplarda boş kalır).
 */
export async function getAdminAuditLog(limit = 50, beforeId?: number): Promise<AuditLogEntry[]> {
  let query = supabase
    .from('admin_audit_log')
    .select('id, created_at, actor_id, action, target_type, target_id, details')
    .order('id', { ascending: false })
    .limit(limit);
  if (beforeId !== undefined) query = query.lt('id', beforeId);
  const { data, error } = await query;
  if (error) {
    console.warn('Could not load admin audit log:', error);
    throw error;
  }
  const rows = (data ?? []) as AuditLogRow[];
  const userIds = new Set<string>();
  for (const r of rows) {
    if (r.actor_id) userIds.add(r.actor_id);
    if (r.target_type === 'user' && r.target_id) userIds.add(r.target_id);
  }
  const profiles = new Map<string, { name: string; username: string }>();
  if (userIds.size > 0) {
    const { data: profileRows } = await supabase.from('profiles').select('id, name, username').in('id', [...userIds]);
    for (const p of (profileRows ?? []) as { id: string; name: string; username: string }[]) profiles.set(p.id, p);
  }
  return rows.map((r) => {
    const actor = r.actor_id ? profiles.get(r.actor_id) : undefined;
    const target = r.target_type === 'user' && r.target_id ? profiles.get(r.target_id) : undefined;
    return {
      id: r.id,
      createdAt: r.created_at,
      actorId: r.actor_id ?? undefined,
      actorName: actor?.name,
      actorUsername: actor?.username,
      action: r.action,
      targetType: r.target_type,
      targetId: r.target_id ?? undefined,
      targetName: target?.name,
      targetUsername: target?.username,
      details: r.details ?? {},
    };
  });
}

/** Oturum açmış kullanıcı banlı mı? (RLS kullanıcıya yalnızca kendi kaydını gösterir.) */
export async function isUserBanned(userId: string): Promise<boolean> {
  const { data, error } = await supabase.from('banned_users').select('user_id').eq('user_id', userId).maybeSingle();
  if (error) return false;
  return Boolean(data);
}

/**
 * Hesabı ve ilişkili tüm verileri kalıcı olarak siler (GDPR md. 17).
 * Silme, service role anahtarına ihtiyaç duyduğu için sunucudaki `delete-account` Edge Function'ında yapılır.
 * Ana yönetici hesabı silinemez: 'superadmin' döner.
 */
export async function deleteMyAccount(): Promise<'ok' | 'superadmin'> {
  const { error } = await supabase.functions.invoke('delete-account', { body: { confirm: true } });
  if (!error) return 'ok';
  let code: string | undefined;
  try {
    code = ((await (error as { context?: Response }).context?.json()) as { error?: string } | undefined)?.error;
  } catch {
    // gövde okunamazsa genel hata olarak fırlatılır
  }
  if (code === 'superadmin_cannot_delete') return 'superadmin';
  throw error;
}

/**
 * İlan Radarı: kayıtlı arama kriterleri (listing_radars). Uyan yeni ilan yayınlandığında bildirimi veritabanı
 * tetikleyicisi yazar (0026_listing_radar.sql); istemci yalnızca radarları yönetir.
 */
interface RadarRow {
  id: string;
  name: string;
  district: string | null;
  room_type: string | null;
  contract_type: string | null;
  min_price: number | null;
  max_price: number | null;
  start_from: string | null;
  start_to: string | null;
  max_stay_months: number | null;
  gender: 'female' | 'male' | null;
  only_video_tour: boolean;
  only_student_verified: boolean;
  roommates_only: boolean;
  active: boolean;
  created_at: string;
  last_notified_at: string | null;
}

const radarFromRow = (row: RadarRow): ListingRadar => ({
  id: row.id,
  name: row.name,
  district: row.district ?? undefined,
  roomType: row.room_type ?? undefined,
  contractType: row.contract_type ?? undefined,
  minPrice: row.min_price ?? undefined,
  maxPrice: row.max_price ?? undefined,
  startFrom: row.start_from ?? undefined,
  startTo: row.start_to ?? undefined,
  maxStayMonths: row.max_stay_months ?? undefined,
  gender: row.gender ?? undefined,
  onlyVideoTour: row.only_video_tour,
  onlyStudentVerified: row.only_student_verified,
  roommatesOnly: row.roommates_only,
  active: row.active,
  createdAt: row.created_at,
  lastNotifiedAt: row.last_notified_at ?? undefined,
});

const radarToRow = (input: Partial<RadarInput> & { active?: boolean }, lang: Language) => ({
  ...(input.name !== undefined ? { name: input.name.trim().slice(0, 60) } : {}),
  ...('district' in input ? { district: input.district ?? null } : {}),
  ...('roomType' in input ? { room_type: input.roomType ?? null } : {}),
  ...('contractType' in input ? { contract_type: input.contractType ?? null } : {}),
  ...('minPrice' in input ? { min_price: input.minPrice ?? null } : {}),
  ...('maxPrice' in input ? { max_price: input.maxPrice ?? null } : {}),
  ...('startFrom' in input ? { start_from: input.startFrom ?? null } : {}),
  ...('startTo' in input ? { start_to: input.startTo ?? null } : {}),
  ...('maxStayMonths' in input ? { max_stay_months: input.maxStayMonths ?? null } : {}),
  ...('gender' in input ? { gender: input.gender ?? null } : {}),
  ...(input.onlyVideoTour !== undefined ? { only_video_tour: input.onlyVideoTour } : {}),
  ...(input.onlyStudentVerified !== undefined ? { only_student_verified: input.onlyStudentVerified } : {}),
  ...(input.roommatesOnly !== undefined ? { roommates_only: input.roommatesOnly } : {}),
  ...(input.active !== undefined ? { active: input.active } : {}),
  lang,
});

export async function listRadars(userId: string): Promise<ListingRadar[]> {
  const { data, error } = await supabase
    .from('listing_radars')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as RadarRow[]).map(radarFromRow);
}

export async function createRadar(userId: string, input: RadarInput, lang: Language): Promise<ListingRadar> {
  const { data, error } = await supabase
    .from('listing_radars')
    .insert({ ...radarToRow(input, lang), user_id: userId })
    .select('*')
    .single<RadarRow>();
  if (error) throw error;
  return radarFromRow(data);
}

export async function updateRadar(
  id: string,
  updates: Partial<RadarInput> & { active?: boolean },
  lang: Language
): Promise<ListingRadar> {
  const { data, error } = await supabase
    .from('listing_radars')
    .update(radarToRow(updates, lang))
    .eq('id', id)
    .select('*')
    .single<RadarRow>();
  if (error) throw error;
  return radarFromRow(data);
}

export async function deleteRadar(id: string): Promise<void> {
  const { error } = await supabase.from('listing_radars').delete().eq('id', id);
  if (error) throw error;
}
