import {
  collection,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  query,
  where,
  updateDoc,
  deleteDoc,
  writeBatch,
  deleteField
} from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage, handleFirestoreError, OperationType } from '../lib/firebase';
import { HousingListing, UserProfile, FirestoreMessage, UserNotification } from '../types';

/**
 * 1. User Profile Management in Firestore
 *
 * /users/{userId}                  → herkese açık profil (giriş yapmış kullanıcılar okuyabilir)
 * /users/{userId}/private/profile  → e-posta, telefon, favoriler (yalnızca sahibi ve adminler)
 *
 * `unipdVerified` alanı istemciden gelir ama firestore.rules bunun kullanıcının
 * doğrulanmış UniPD e-postasıyla eşleşmesini zorunlu tutar; yani sahte rozet yazılamaz.
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

const privateProfileRef = (userId: string) => doc(db, 'users', userId, 'private', 'profile');

export async function syncUserProfile(
  user: Partial<UserProfile> & { id: string },
  unipdVerified: boolean
): Promise<void> {
  const path = `users/${user.id}`;
  try {
    const userRef = doc(db, 'users', user.id);
    const existingSnap = await getDoc(userRef);

    let safePhotoURL = user.avatar || user.photoURL || '';
    if (safePhotoURL.startsWith('data:') || safePhotoURL.length > 2048) {
      console.warn('Base64 photo detected! Discarding to protect Firestore 1MB document limit.');
      safePhotoURL = existingSnap.exists() ? (existingSnap.data()?.photoURL || '') : '';
    }

    const now = new Date().toISOString();
    const publicData: PublicUserProfile = {
      id: user.id,
      name: (user.name || user.username || 'Padova Öğrencisi').slice(0, 100),
      username: (user.username || user.email?.split('@')[0] || 'student').slice(0, 50),
      faculty: (user.faculty || 'Università degli Studi di Padova').slice(0, 150),
      bio: (user.bio || '').slice(0, 500),
      photoURL: safePhotoURL,
      unipdVerified,
      updatedAt: now,
    };

    // Belge her seferinde tamamen yazılır: eski sürümün herkese açık belgede tuttuğu
    // e-posta/telefon/rol alanları böylece temizlenir (kurallar yalnızca bu alanlara izin verir).
    const createdAt = (existingSnap.exists() && existingSnap.data()?.createdAt) || now;
    await setDoc(userRef, { ...publicData, createdAt });

    await setDoc(
      privateProfileRef(user.id),
      {
        email: user.email || '',
        phone: (user.phone || '').slice(0, 30),
        updatedAt: now,
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateUserProfilePhoto(userId: string, photoURL: string): Promise<void> {
  if (!photoURL.startsWith('https://')) {
    throw new Error('Geçersiz profil fotoğrafı bağlantısı. Yalnızca HTTPS web bağlantıları kaydedilebilir.');
  }
  const path = `users/${userId}`;
  try {
    await updateDoc(doc(db, 'users', userId), {
      photoURL,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function getUserProfile(
  userId: string
): Promise<(PublicUserProfile & { email?: string; phone?: string; savedListingIds?: string[] }) | null> {
  const path = `users/${userId}`;
  try {
    const [publicSnap, privateSnap] = await Promise.all([
      getDoc(doc(db, 'users', userId)),
      getDoc(privateProfileRef(userId)),
    ]);
    if (!publicSnap.exists()) return null;
    return {
      ...(publicSnap.data() as PublicUserProfile),
      ...(privateSnap.exists() ? privateSnap.data() : {}),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function getPublicUserProfile(userId: string): Promise<PublicUserProfile | null> {
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    return snap.exists() ? (snap.data() as PublicUserProfile) : null;
  } catch (error) {
    console.warn(`Could not load profile users/${userId}:`, error);
    return null;
  }
}

export async function updateUserFavorites(userId: string, savedListingIds: string[]): Promise<void> {
  const path = `users/${userId}/private/profile`;
  try {
    await setDoc(
      privateProfileRef(userId),
      { savedListingIds, updatedAt: new Date().toISOString() },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Admin paneli için: UniPD doğrulaması geçmiş kullanıcılar.
export function subscribeToVerifiedUsers(
  onUpdate: (users: PublicUserProfile[]) => void
) {
  const q = query(collection(db, 'users'), where('unipdVerified', '==', true));
  return onSnapshot(
    q,
    (snapshot) => onUpdate(snapshot.docs.map((d) => d.data() as PublicUserProfile)),
    (error) => console.warn('Verified users subscription error:', error)
  );
}

/**
 * 2. Admin Yetkileri: /admins/{userId}
 * Yalnızca ana admin yazabilir (firestore.rules). Belgenin varlığı admin olmak demektir.
 */
export interface AdminGrant {
  uid: string;
  note?: string;
  grantedBy: string;
  createdAt: string;
}

export function subscribeToAdminStatus(userId: string, onUpdate: (isAdmin: boolean) => void) {
  return onSnapshot(
    doc(db, 'admins', userId),
    (snap) => onUpdate(snap.exists()),
    () => onUpdate(false)
  );
}

export function subscribeToAdminGrants(onUpdate: (grants: AdminGrant[]) => void) {
  return onSnapshot(
    collection(db, 'admins'),
    (snapshot) => onUpdate(snapshot.docs.map((d) => ({ ...(d.data() as AdminGrant), uid: d.id }))),
    (error) => console.warn('Admin grants subscription error:', error)
  );
}

export async function grantAdmin(uid: string, grantedBy: string, note?: string): Promise<void> {
  const path = `admins/${uid}`;
  try {
    await setDoc(doc(db, 'admins', uid), {
      uid,
      note: (note || '').slice(0, 200),
      grantedBy,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function revokeAdmin(uid: string): Promise<void> {
  const path = `admins/${uid}`;
  try {
    await deleteDoc(doc(db, 'admins', uid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * 3. Housing Listings Management in Firestore: /listings/{listingId}
 */

// Kimlik alanı belge ID'sidir; belgenin içine tekrar yazılmaz.
const toFirestoreListing = (listing: Partial<HousingListing>) => {
  const { id: _id, ...rest } = listing;
  return rest;
};

export async function saveListingToFirestore(listing: HousingListing, userId: string): Promise<void> {
  const path = `listings/${listing.id}`;
  try {
    const now = new Date().toISOString();
    await setDoc(doc(db, 'listings', listing.id), {
      ...toFirestoreListing(listing),
      userId,
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
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
      ...toFirestoreListing(updates),
      updatedAt: new Date().toISOString(),
    };
    fieldsToRemove.forEach((field) => {
      payload[field] = deleteField();
    });
    await updateDoc(doc(db, 'listings', listingId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteListingFromFirestore(listing: HousingListing): Promise<void> {
  const path = `listings/${listing.id}`;
  try {
    await deleteDoc(doc(db, 'listings', listing.id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
  await deleteListingPhotos(listing.images || []);
}

// İlanın Firebase Storage'daki fotoğraflarını temizler. Başkasına ait dosyalar
// (örn. admin başka birinin ilanını sildiğinde) storage.rules gereği silinemez; bu durumda sessizce geçilir.
async function deleteListingPhotos(imageUrls: string[]): Promise<void> {
  const storageUrls = imageUrls.filter((url) => url.includes('firebasestorage.googleapis.com'));
  await Promise.all(
    storageUrls.map((url) =>
      deleteObject(ref(storage, url)).catch((err) => {
        console.warn('Could not delete listing photo from storage:', err?.code || err);
      })
    )
  );
}

export function subscribeToListings(
  onUpdate: (listings: HousingListing[]) => void,
  onError?: (error: unknown) => void
) {
  return onSnapshot(
    collection(db, 'listings'),
    (snapshot) => {
      onUpdate(snapshot.docs.map((docSnap) => ({ ...(docSnap.data() as HousingListing), id: docSnap.id })));
    },
    (error) => {
      console.warn('Listings snapshot subscription error:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * 4. Direct Messages Management in Firestore: /messages/{messageId}
 * Her mesaj iki katılımcı içerir; kullanıcı yalnızca dahil olduğu mesajları okuyabilir.
 */
export function subscribeToMessages(
  userId: string,
  onUpdate: (messages: FirestoreMessage[]) => void,
  onError?: (error: unknown) => void
) {
  const q = query(collection(db, 'messages'), where('participants', 'array-contains', userId));
  return onSnapshot(
    q,
    (snapshot) => {
      const messages = snapshot.docs.map((d) => ({ ...(d.data() as FirestoreMessage), id: d.id }));
      messages.sort((a, b) => a.createdAt - b.createdAt);
      onUpdate(messages);
    },
    (error) => {
      console.warn('Messages subscription error:', error);
      if (onError) onError(error);
    }
  );
}

export async function sendMessageToFirestore(message: Omit<FirestoreMessage, 'id' | 'participants' | 'read' | 'createdAt'>): Promise<void> {
  const messageRef = doc(collection(db, 'messages'));
  const path = `messages/${messageRef.id}`;
  try {
    await setDoc(messageRef, {
      senderId: message.senderId,
      recipientId: message.recipientId,
      participants: [message.senderId, message.recipientId],
      text: message.text.slice(0, 2000),
      listingId: message.listingId,
      subject: message.subject?.slice(0, 200),
      read: false,
      createdAt: Date.now(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function markMessagesRead(messageIds: string[]): Promise<void> {
  if (messageIds.length === 0) return;
  const batch = writeBatch(db);
  messageIds.forEach((id) => batch.update(doc(db, 'messages', id), { read: true }));
  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'messages');
  }
}

/**
 * 5. User Notifications Management in Firestore: /notifications/{notificationId}
 * Kullanıcı yalnızca kendine bildirim yazabilir; adminler ilan sahiplerine yazabilir.
 */
export function subscribeToNotifications(
  userId: string,
  onUpdate: (notifications: UserNotification[]) => void
) {
  const q = query(collection(db, 'notifications'), where('userId', '==', userId));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ ...(d.data() as UserNotification), id: d.id }));
      items.sort((a, b) => b.timestamp - a.timestamp);
      onUpdate(items);
    },
    (error) => console.warn('Notifications subscription error:', error)
  );
}

export async function saveNotificationToFirestore(
  notification: Omit<UserNotification, 'id' | 'read' | 'timestamp'>
): Promise<void> {
  const notifRef = doc(collection(db, 'notifications'));
  try {
    await setDoc(notifRef, {
      ...notification,
      title: notification.title.slice(0, 120),
      message: notification.message.slice(0, 500),
      read: false,
      timestamp: Date.now(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `notifications/${notifRef.id}`);
  }
}

export async function markNotificationsRead(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const batch = writeBatch(db);
  ids.forEach((id) => batch.update(doc(db, 'notifications', id), { read: true }));
  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'notifications');
  }
}

export async function deleteNotificationFromFirestore(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'notifications', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `notifications/${id}`);
  }
}
