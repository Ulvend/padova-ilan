import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  verifyBeforeUpdateEmail,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  User as FirebaseUser
} from 'firebase/auth';
import { isUniPdEmail } from '../config';
import { 
  initializeFirestore,
  doc,
  getDocFromServer 
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Firestore with exact database ID.
// İlan nesnelerinde isteğe bağlı alanlar `undefined` olabiliyor; Firestore bunları
// varsayılan olarak reddettiği için yok sayılmalarını istiyoruz.
export const db = initializeFirestore(
  app,
  { ignoreUndefinedProperties: true },
  firebaseConfig.firestoreDatabaseId
);

// Initialize Firebase Storage
export const storage = getStorage(app);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Providers
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');

// Authentication Helper Functions
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
};

export const signInWithApple = async () => {
  try {
    const result = await signInWithPopup(auth, appleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Apple Sign-In Error:', error);
    throw error;
  }
};

// E-posta doğrulama ve şifre sıfırlama linklerinden sonra kullanıcı uygulamaya geri döner.
const actionCodeSettings = () => ({ url: window.location.origin });

export const registerWithEmail = async (email: string, password: string, displayName: string) => {
  const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (displayName.trim()) {
    await updateProfile(user, { displayName: displayName.trim() });
  }
  await sendEmailVerification(user, actionCodeSettings());
  return user;
};

export const signInWithEmail = async (email: string, password: string) => {
  const { user } = await signInWithEmailAndPassword(auth, email.trim(), password);
  return user;
};

export const sendResetPasswordEmail = (email: string) =>
  sendPasswordResetEmail(auth, email.trim(), actionCodeSettings());

export const resendVerificationEmail = async () => {
  if (!auth.currentUser) throw new Error('Oturum açık değil.');
  await sendEmailVerification(auth.currentUser, actionCodeSettings());
};

/**
 * UniPD rozeti için hesabın e-postasını UniPD adresine taşır.
 * Firebase adrese bir doğrulama linki yollar; link tıklanana kadar hesap e-postası değişmez.
 */
export const requestUniPdEmailVerification = async (unipdEmail: string) => {
  if (!auth.currentUser) throw new Error('Oturum açık değil.');
  if (!isUniPdEmail(unipdEmail)) {
    throw new Error('Lütfen @studenti.unipd.it veya @unipd.it uzantılı bir adres girin.');
  }
  await verifyBeforeUpdateEmail(auth.currentUser, unipdEmail.trim(), actionCodeSettings());
};

/**
 * Kullanıcıyı sunucudan yeniler ve ID token'ını zorla tazeler; böylece yeni
 * doğrulanan e-posta Firestore kurallarına (`email_verified`) hemen yansır.
 */
export const reloadCurrentUser = async (): Promise<FirebaseUser | null> => {
  const user = auth.currentUser;
  if (!user) return null;
  await user.reload();
  await user.getIdToken(true);
  return auth.currentUser;
};

// Şifre değişikliği: Firebase güvenlik gereği önce mevcut şifreyle yeniden doğrulama ister.
export const changePassword = async (currentPassword: string, newPassword: string) => {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error('Oturum açık değil.');
  const hasPassword = user.providerData.some((p) => p.providerId === 'password');
  if (!hasPassword) {
    throw new Error('Hesabınıza Google/Apple ile giriş yapıyorsunuz; değiştirilecek bir şifre yok.');
  }
  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, currentPassword));
  await updatePassword(user, newPassword);
};

export const isUniPdVerifiedUser = (user: FirebaseUser | null | undefined): boolean =>
  Boolean(user && user.emailVerified && isUniPdEmail(user.email));

// Firebase Auth hata kodlarını kullanıcıya gösterilecek Türkçe mesajlara çevirir.
export const describeAuthError = (error: unknown): string => {
  const code = (error as { code?: string })?.code || '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'E-posta veya şifre hatalı.';
    case 'auth/email-already-in-use':
      return 'Bu e-posta ile zaten bir hesap var. Giriş yapmayı deneyin.';
    case 'auth/invalid-email':
      return 'Geçersiz e-posta adresi.';
    case 'auth/weak-password':
      return 'Şifre en az 6 karakter olmalıdır.';
    case 'auth/too-many-requests':
      return 'Çok fazla deneme yapıldı. Lütfen biraz sonra tekrar deneyin.';
    case 'auth/requires-recent-login':
      return 'Güvenlik için lütfen çıkış yapıp tekrar giriş yapın, sonra yeniden deneyin.';
    case 'auth/operation-not-allowed':
      return 'Bu giriş yöntemi Firebase konsolunda etkin değil.';
    case 'auth/network-request-failed':
      return 'Ağ hatası. İnternet bağlantınızı kontrol edin.';
    case 'auth/popup-blocked':
      return 'Tarayıcı açılır pencereyi engelledi. Lütfen izin verip tekrar deneyin.';
    default:
      return (error as Error)?.message || 'Beklenmeyen bir hata oluştu.';
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign Out Error:', error);
    throw error;
  }
};

// Operation types for Firestore Error Reporting
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection check as required by Firestore setup guidelines
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore client is offline or initializing.");
    }
  }
}

// Run test connection
testConnection();
