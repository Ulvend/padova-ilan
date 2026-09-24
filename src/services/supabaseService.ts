import { supabase, handleDbError, OperationType } from '../lib/supabase';
import { HousingListing, UserProfile, FirestoreMessage, UserNotification, PosterInfo, Flatmate, VideoAngle } from '../types';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { defaultUsername } from '../utils/username';

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

/** Kullanıcı adı boşta mı? Kayıt sırasında (oturum yokken) da çalışır. Ağ/sunucu hatasında fırlatır. */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_username_available', { p_username: username });
  if (error) throw error;
  return Boolean(data);
}

/** Kullanıcı adını değiştirir; başkası almışsa 'taken' döner. */
export async function updateUsername(userId: string, username: string): Promise<'ok' | 'taken'> {
  const { error } = await supabase
    .from('profiles')
    .update({ username, updated_at: new Date().toISOString() })
    .eq('id', userId);
  if (isUniqueViolation(error)) return 'taken';
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
    if (isUniqueViolation(profileError)) {
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
export interface AdminGrant {
  uid: string;
  note?: string;
  grantedBy: string;
  createdAt: string;
}

interface AdminRow {
  uid: string;
  note: string | null;
  granted_by: string;
  created_at: string;
}

export function subscribeToAdminStatus(userId: string, onUpdate: (isAdmin: boolean) => void): () => void {
  const load = async () => {
    const { data, error } = await supabase.from('admins').select('uid').eq('uid', userId).maybeSingle();
    onUpdate(!error && Boolean(data));
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
  compatibility_score: number;
  compatibility_reason: string;
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
  confirmation_time_left: string;
  description: string;
  poster: PosterInfo;
  images: string[];
  created_at: string;
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
  compatibilityScore: row.compatibility_score,
  compatibilityReason: row.compatibility_reason,
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
  confirmationTimeLeft: row.confirmation_time_left,
  description: row.description,
  poster: row.poster,
  images: row.images || [],
  createdAt: row.created_at,
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
    compatibilityScore: 'compatibility_score',
    compatibilityReason: 'compatibility_reason',
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
    confirmationTimeLeft: 'confirmation_time_left',
    description: 'description',
    poster: 'poster',
    images: 'images',
    views: 'views',
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
    if (column) row[column] = value;
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
  await deleteListingPhotos(listing.images || []);
}

// İlanın Supabase Storage'daki fotoğraflarını temizler.
async function deleteListingPhotos(imageUrls: string[]): Promise<void> {
  const paths = imageUrls
    .map((url) => extractStoragePath(url, 'listing_photos'))
    .filter((p): p is string => Boolean(p));
  if (paths.length === 0) return;
  const { error } = await supabase.storage.from('listing_photos').remove(paths);
  if (error) console.warn('Could not delete listing photos from storage:', error.message);
}

function extractStoragePath(url: string, bucket: string): string | null {
  const marker = `/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length));
}

export function subscribeToListings(
  onUpdate: (listings: HousingListing[]) => void,
  onError?: (error: unknown) => void
): () => void {
  const load = async () => {
    const { data, error } = await supabase.from('listings').select('*');
    if (error) {
      console.warn('Listings subscription error:', error);
      if (onError) onError(error);
      return;
    }
    onUpdate((data as ListingRow[]).map(listingFromRow));
  };
  load();
  const channel = supabase
    .channel('listings-all')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'listings' }, load)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * 4. Direct Messages Management: messages
 * Her mesaj iki katılımcı içerir; kullanıcı yalnızca dahil olduğu mesajları okuyabilir.
 */
interface MessageRow {
  id: string;
  sender_id: string;
  recipient_id: string;
  text: string;
  listing_id: string | null;
  subject: string | null;
  read: boolean;
  created_at: number;
}

const messageFromRow = (row: MessageRow): FirestoreMessage => ({
  id: row.id,
  senderId: row.sender_id,
  recipientId: row.recipient_id,
  participants: [row.sender_id, row.recipient_id],
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
  const load = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`);
    if (error) {
      console.warn('Messages subscription error:', error);
      if (onError) onError(error);
      return;
    }
    const messages = (data as MessageRow[]).map(messageFromRow);
    messages.sort((a, b) => a.createdAt - b.createdAt);
    onUpdate(messages);
  };
  load();
  const channel = supabase
    .channel(`messages-${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, load)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
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

export type { RealtimeChannel };

/**
 * Görüntülenme sayacı. Sayaç listings tablosundan ayrıdır (her artış tüm istemcilerde liste yenilemesi
 * tetiklemesin diye); sunucu ilan sahibinin kendi görüntülemesini ve arşivli ilanları saymaz.
 */
export async function recordListingView(listingId: string): Promise<void> {
  const { error } = await supabase.rpc('record_listing_view', { p_listing_id: listingId });
  if (error) console.warn('Could not record listing view:', error);
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
