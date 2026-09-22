import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { HousingListing, UserProfile, DirectMessage, UserNotification } from '../types';

/**
 * 1. User Profile Management in Firestore: /users/{userId}
 */
export async function syncUserProfile(user: Partial<UserProfile> & { id: string }): Promise<void> {
  const path = `users/${user.id}`;
  try {
    const userRef = doc(db, 'users', user.id);
    const existingSnap = await getDoc(userRef);

    let safePhotoURL = user.avatar || user.photoURL || '';
    if (safePhotoURL.startsWith('data:') || safePhotoURL.length > 2048) {
      console.warn('Base64 photo detected! Discarding to protect Firestore 1MB document limit.');
      safePhotoURL = existingSnap.exists() ? (existingSnap.data()?.photoURL || '') : '';
    }

    const baseData = {
      id: user.id,
      email: user.email || '',
      name: user.name || user.username || 'Padova Öğrencisi',
      username: user.username || user.email?.split('@')[0] || 'student',
      faculty: user.faculty || 'Università degli Studi di Padova',
      bio: user.bio || '',
      phone: user.phone || '',
      photoURL: safePhotoURL,
      studentIdVerified: user.studentIdVerified ?? false,
      ssoVerified: user.ssoVerified ?? false,
      role: user.role || 'user',
      savedListingIds: user.savedListings || [],
      updatedAt: new Date().toISOString()
    };

    if (!existingSnap.exists()) {
      await setDoc(userRef, {
        ...baseData,
        createdAt: new Date().toISOString()
      });
    } else {
      await updateDoc(userRef, baseData);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateUserProfilePhoto(userId: string, photoURL: string): Promise<void> {
  if (!photoURL.startsWith('https://') && !photoURL.startsWith('http://')) {
    throw new Error('Geçersiz profil fotoğrafı bağlantısı. Yalnızca HTTPS web bağlantıları kaydedilebilir.');
  }
  const path = `users/${userId}`;
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      photoURL,
      avatar: photoURL,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const path = `users/${userId}`;
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return null;
    return snap.data() as UserProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function updateUserFavorites(userId: string, savedListingIds: string[]): Promise<void> {
  const path = `users/${userId}`;
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      savedListingIds,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * 2. Housing Listings Management in Firestore: /listings/{listingId}
 */
export async function saveListingToFirestore(listing: HousingListing, userId: string): Promise<void> {
  const path = `listings/${listing.id}`;
  try {
    const listingRef = doc(db, 'listings', listing.id);
    await setDoc(listingRef, {
      ...listing,
      userId,
      createdAt: listing.createdAt || new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeToListings(
  onUpdate: (listings: HousingListing[]) => void,
  onError?: (error: any) => void
) {
  const path = 'listings';
  try {
    const listingsRef = collection(db, 'listings');
    return onSnapshot(
      listingsRef,
      (snapshot) => {
        const firestoreListings: HousingListing[] = [];
        snapshot.forEach((docSnap) => {
          firestoreListings.push(docSnap.data() as HousingListing);
        });
        onUpdate(firestoreListings);
      },
      (error) => {
        console.warn('Listings snapshot subscription error:', error);
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return () => {};
  }
}

/**
 * 3. Direct Messages Management in Firestore: /messages/{messageId}
 */
export async function sendMessageToFirestore(message: DirectMessage): Promise<void> {
  const path = `messages/${message.id}`;
  try {
    const messageRef = doc(db, 'messages', message.id);
    await setDoc(messageRef, {
      ...message,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * 4. User Notifications Management in Firestore: /notifications/{notificationId}
 */
export async function saveNotificationToFirestore(notification: UserNotification): Promise<void> {
  const path = `notifications/${notification.id}`;
  try {
    const notifRef = doc(db, 'notifications', notification.id);
    await setDoc(notifRef, {
      ...notification,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
