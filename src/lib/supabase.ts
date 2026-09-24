import { createClient, type User as SupabaseUser } from '@supabase/supabase-js';
import { isUniPdEmail } from '../config';
import type { Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Supabase yapılandırması eksik. .env.local dosyasına VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY ekleyin (bkz. .env.example).'
  );
}

// createClient throws synchronously on a falsy URL; fall back to a placeholder so the app
// still renders (with network errors) instead of a blank screen when env vars aren't set yet.
export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder-anon-key');

// E-posta doğrulama ve şifre sıfırlama linklerinden sonra kullanıcı uygulamaya geri döner.
const redirectTo = () => window.location.origin;

// Authentication Helper Functions
export const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: redirectTo() },
  });
  if (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
};

export const signInWithApple = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: { redirectTo: redirectTo() },
  });
  if (error) {
    console.error('Apple Sign-In Error:', error);
    throw error;
  }
};

export const registerWithEmail = async (email: string, password: string, displayName: string, faculty?: string, username?: string) => {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        display_name: displayName.trim(),
        ...(faculty ? { faculty } : {}),
        ...(username ? { username } : {}),
      },
      emailRedirectTo: redirectTo(),
    },
  });
  if (error) throw error;
  return data.user;
};

export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw error;
  return data.user;
};

export const sendResetPasswordEmail = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: redirectTo(),
  });
  if (error) throw error;
};

export const resendVerificationEmail = async () => {
  const { data } = await supabase.auth.getUser();
  if (!data.user?.email) throw Object.assign(new Error('Not signed in.'), { code: 'app/not-signed-in' });
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: data.user.email,
    options: { emailRedirectTo: redirectTo() },
  });
  if (error) throw error;
};

/**
 * UniPD rozeti için hesabın e-postasını UniPD adresine taşır.
 * Supabase adrese bir doğrulama linki yollar; link tıklanana kadar hesap e-postası değişmez.
 */
export const requestUniPdEmailVerification = async (unipdEmail: string) => {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw Object.assign(new Error('Not signed in.'), { code: 'app/not-signed-in' });
  if (!isUniPdEmail(unipdEmail)) {
    throw Object.assign(new Error('Not a UniPD address.'), { code: 'app/not-unipd-email' });
  }
  const { error } = await supabase.auth.updateUser(
    { email: unipdEmail.trim() },
    { emailRedirectTo: redirectTo() }
  );
  if (error) throw error;
};

/**
 * Kullanıcıyı sunucudan yeniler; böylece yeni doğrulanan e-posta hemen yansır.
 */
export const reloadCurrentUser = async (): Promise<SupabaseUser | null> => {
  const { data, error } = await supabase.auth.refreshSession();
  if (error) {
    const { data: fallback } = await supabase.auth.getUser();
    return fallback.user;
  }
  return data.user;
};

// Şifre değişikliği: Supabase'te updateUser tek başına yeniden kimlik doğrulama istemez,
// bu yüzden mevcut şifreyi önce signInWithPassword ile doğruluyoruz (Firebase'deki reauthenticate ile aynı UX).
export const changePassword = async (currentPassword: string, newPassword: string) => {
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email;
  if (!email) throw Object.assign(new Error('Not signed in.'), { code: 'app/not-signed-in' });

  const { error: verifyError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
  if (verifyError) {
    throw { code: 'auth/wrong-password', message: 'Wrong password.' };
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
};

export const isUniPdVerifiedUser = (user: SupabaseUser | null | undefined): boolean =>
  Boolean(user && user.email_confirmed_at && isUniPdEmail(user.email));

// Supabase Auth hatalarını kullanıcıya gösterilecek Türkçe mesajlara çevirir.
// Firebase'in aksine Supabase hataları kod yerine mesaj metniyle ayırt edilir.
export const describeAuthError = (error: unknown, lang: Language = 'tr'): string => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.tr;
  const withCode = error as { code?: string; message?: string; status?: number };
  if (withCode?.code === 'auth/wrong-password') return t.errWrongPassword;
  if (withCode?.code === 'app/not-signed-in') return t.errNotSignedIn;
  if (withCode?.code === 'app/not-unipd-email') return t.errUnipdDomain;

  const message = withCode?.message || '';
  if (/invalid login credentials/i.test(message)) return t.errBadCredentials;
  if (/already registered/i.test(message)) return t.errAlreadyRegistered;
  if (/user not found/i.test(message)) return t.errBadCredentials;
  if (/invalid email/i.test(message)) return t.errInvalidEmail;
  if (/password should be at least/i.test(message)) return t.errPasswordShort;
  if (/rate limit|too many requests/i.test(message)) return t.errRateLimit;
  if (/email not confirmed/i.test(message)) return t.errEmailNotConfirmed;
  if (/network/i.test(message)) return t.errNetwork;
  if (/popup/i.test(message)) return t.errPopup;
  if (/provider is not enabled/i.test(message)) return t.errProviderDisabled;
  return message || t.errUnexpected;
};

export const logOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Sign Out Error:', error);
    throw error;
  }
};

// Operation types for error reporting
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface DbErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  };
}

export function handleDbError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: DbErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {},
    operationType,
    path,
  };
  console.error('Database Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
