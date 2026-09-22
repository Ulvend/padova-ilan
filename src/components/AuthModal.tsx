import React, { useState, useEffect } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  ArrowLeft, 
  CheckCircle2, 
  Send, 
  RefreshCw, 
  ShieldCheck, 
  GraduationCap,
  Sparkles,
  Info,
  User,
  BookOpen,
  UserPlus,
  LogIn,
  KeyRound,
  MessageSquare,
  Zap,
  AlertCircle,
  ChevronDown
} from 'lucide-react';
import { Language, UserProfile } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { signInWithGoogle, signInWithApple } from '../lib/firebase';
import { syncUserProfile } from '../services/firebaseService';
import { UNIPD_DEPARTMENTS } from '../data/unipdDepartments';

const AUTH_MODAL_I18N: Record<Language, {
  ssoLoginTitle: string;
  ssoLoginBtn: string;
  ssoLoginLoading: string;
  ssoRegisterTitle: string;
  ssoRegisterBtn: string;
  ssoRegisterLoading: string;
  unipdAuthSectionTitle: string;
  googleLogin: string;
  googleRegister: string;
  appleLogin: string;
  appleRegister: string;
  orEmailLogin: string;
  orEmailRegister: string;
}> = {
  tr: {
    ssoLoginTitle: 'UniPD Kurumsal SSO (Shibboleth)',
    ssoLoginBtn: 'UniPD Kurumsal SSO ile Giriş Yap',
    ssoLoginLoading: 'UniPD SSO Doğrulanıyor...',
    ssoRegisterTitle: 'UniPD Kurumsal SSO ile Kayıt Ol',
    ssoRegisterBtn: 'UniPD SSO ile Kayıt Ol',
    ssoRegisterLoading: 'UniPD Kurumsal Doğrulama Yapılıyor...',
    unipdAuthSectionTitle: 'UniPD Auth (Kurumsal Giriş & Doğrulama)',
    googleLogin: 'Google ile Giriş',
    googleRegister: 'Google ile Bağlan',
    appleLogin: 'Apple ile Giriş',
    appleRegister: 'Apple ile Bağlan',
    orEmailLogin: 'veya e-posta ve şifre ile',
    orEmailRegister: 'veya manuel kayıt oluştur',
  },
  en: {
    ssoLoginTitle: 'UniPD Institutional SSO (Shibboleth)',
    ssoLoginBtn: 'Log in with UniPD Institutional SSO',
    ssoLoginLoading: 'Authenticating UniPD SSO...',
    ssoRegisterTitle: 'Register with UniPD Institutional SSO',
    ssoRegisterBtn: 'Register with UniPD SSO',
    ssoRegisterLoading: 'Verifying UniPD Institution...',
    unipdAuthSectionTitle: 'UniPD Auth (Institutional SSO)',
    googleLogin: 'Sign in with Google',
    googleRegister: 'Sign up with Google',
    appleLogin: 'Sign in with Apple',
    appleRegister: 'Sign up with Apple',
    orEmailLogin: 'or with email and password',
    orEmailRegister: 'or register manually with email',
  },
  it: {
    ssoLoginTitle: 'UniPD SSO Istituzionale (Shibboleth)',
    ssoLoginBtn: 'Accedi con SSO Istituzionale UniPD',
    ssoLoginLoading: 'Autenticazione UniPD SSO in corso...',
    ssoRegisterTitle: 'Registrati con SSO Istituzionale UniPD',
    ssoRegisterBtn: 'Registrati con UniPD SSO',
    ssoRegisterLoading: 'Verifica Istituzionale UniPD in corso...',
    unipdAuthSectionTitle: 'UniPD Auth (SSO Istituzionale)',
    googleLogin: 'Accedi con Google',
    googleRegister: 'Registrati con Google',
    appleLogin: 'Accedi con Apple',
    appleRegister: 'Registrati con Apple',
    orEmailLogin: 'oppure con email e password',
    orEmailRegister: 'oppure crea un account manuale',
  },
  de: {
    ssoLoginTitle: 'UniPD Institutionelles SSO (Shibboleth)',
    ssoLoginBtn: 'Mit UniPD Institutionellem SSO anmelden',
    ssoLoginLoading: 'UniPD SSO wird überprüft...',
    ssoRegisterTitle: 'Mit UniPD Institutionellem SSO registrieren',
    ssoRegisterBtn: 'Mit UniPD SSO registrieren',
    ssoRegisterLoading: 'UniPD Verifizierung läuft...',
    unipdAuthSectionTitle: 'UniPD Auth (Institutionelles SSO)',
    googleLogin: 'Mit Google anmelden',
    googleRegister: 'Mit Google registrieren',
    appleLogin: 'Mit Apple anmelden',
    appleRegister: 'Mit Apple registrieren',
    orEmailLogin: 'oder mit E-Mail und Passwort',
    orEmailRegister: 'oder manuell registrieren',
  },
  ru: {
    ssoLoginTitle: 'Корпоративный SSO UniPD (Shibboleth)',
    ssoLoginBtn: 'Войти через корпоративный SSO UniPD',
    ssoLoginLoading: 'Проверка UniPD SSO...',
    ssoRegisterTitle: 'Регистрация через корпоративный SSO UniPD',
    ssoRegisterBtn: 'Зарегистрироваться через UniPD SSO',
    ssoRegisterLoading: 'Идет верификация UniPD...',
    unipdAuthSectionTitle: 'UniPD Auth (Корпоративный SSO)',
    googleLogin: 'Войти через Google',
    googleRegister: 'Регистрация через Google',
    appleLogin: 'Войти через Apple',
    appleRegister: 'Регистрация через Apple',
    orEmailLogin: 'или с помощью email и пароля',
    orEmailRegister: 'или зарегистрироваться вручную',
  },
  hi: {
    ssoLoginTitle: 'UniPD संस्थागत SSO (Shibboleth)',
    ssoLoginBtn: 'UniPD संस्थागत SSO से लॉगिन करें',
    ssoLoginLoading: 'UniPD SSO सत्यापित हो रहा है...',
    ssoRegisterTitle: 'UniPD संस्थागत SSO से पंजीकरण करें',
    ssoRegisterBtn: 'UniPD SSO से पंजीकरण करें',
    ssoRegisterLoading: 'UniPD संस्थागत सत्यापन हो रहा है...',
    unipdAuthSectionTitle: 'UniPD Auth (संस्थागत SSO)',
    googleLogin: 'Google से लॉगिन करें',
    googleRegister: 'Google से पंजीकरण करें',
    appleLogin: 'Apple से लॉगिन करें',
    appleRegister: 'Apple से पंजीकरण करें',
    orEmailLogin: 'या ईमेल और पासवर्ड से',
    orEmailRegister: 'या मैन्युअल रूप से पंजीकरण करें',
  },
};

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register' | 'forgot';
  currentLang?: Language;
  userEmail?: string;
  onLoginSuccess?: (userData?: Partial<UserProfile>) => void;
  authReason?: 'chat' | 'createListing' | 'default' | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  currentLang = 'tr',
  userEmail = 'cnkborasimsek@gmail.com',
  onLoginSuccess,
  authReason,
}) => {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.tr;
  const authI18n = AUTH_MODAL_I18N[currentLang] || AUTH_MODAL_I18N.tr;

  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'sent'>(initialMode);
  const [email, setEmail] = useState(userEmail);
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [faculty, setFaculty] = useState(UNIPD_DEPARTMENTS[0]?.name || "DEI - Ingegneria dell'Informazione");
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSsoAuthenticating, setIsSsoAuthenticating] = useState(false);
  const [isGoogleAuthenticating, setIsGoogleAuthenticating] = useState(false);
  const [isAppleAuthenticating, setIsAppleAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Sync mode when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setEmail(userEmail);
      setIsSubmitting(false);
      setIsSsoAuthenticating(false);
      setIsGoogleAuthenticating(false);
      setIsAppleAuthenticating(false);
      setAuthError(null);
    }
  }, [isOpen, initialMode, userEmail]);

  const handleGoogleAuth = async () => {
    setIsGoogleAuthenticating(true);
    setAuthError(null);
    try {
      const user = await signInWithGoogle();
      const isSuper = user.email === 'cnkborasimsek@gmail.com';
      const profile: Partial<UserProfile> = {
        id: user.uid,
        name: user.displayName || user.email?.split('@')[0] || 'Google Student',
        email: user.email || '',
        username: user.email ? user.email.split('@')[0] : 'google_student',
        avatar: user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        faculty: 'Università degli Studi di Padova',
        studentIdVerified: user.email?.endsWith('@studenti.unipd.it') || user.email?.endsWith('@unipd.it') || isSuper,
        ssoVerified: true,
        ssoProvider: 'Google Auth (Firebase)',
        role: isSuper ? 'superadmin' : 'student',
        userHash: `usr_google_${user.uid.slice(0, 8)}`,
      };
      await syncUserProfile({
        ...profile,
        id: user.uid
      });
      if (onLoginSuccess) {
        onLoginSuccess(profile);
      }
      onClose();
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      // If user closed popup intentionally
      if (err?.code !== 'auth/popup-closed-by-user') {
        setAuthError(err?.message || 'Google ile giriş başarısız oldu.');
      }
    } finally {
      setIsGoogleAuthenticating(false);
    }
  };

  const handleAppleAuth = async () => {
    setIsAppleAuthenticating(true);
    setAuthError(null);
    try {
      const user = await signInWithApple();
      const isSuper = user.email === 'cnkborasimsek@gmail.com';
      const profile: Partial<UserProfile> = {
        id: user.uid,
        name: user.displayName || 'Apple Student',
        email: user.email || '',
        username: user.email ? user.email.split('@')[0] : `apple_${user.uid.slice(0, 6)}`,
        avatar: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
        faculty: 'Università degli Studi di Padova',
        studentIdVerified: user.email?.endsWith('@studenti.unipd.it') || user.email?.endsWith('@unipd.it') || isSuper,
        ssoVerified: true,
        ssoProvider: 'Apple ID (Firebase)',
        role: isSuper ? 'superadmin' : 'student',
        userHash: `usr_apple_${user.uid.slice(0, 8)}`,
      };
      await syncUserProfile({
        ...profile,
        id: user.uid
      });
      if (onLoginSuccess) {
        onLoginSuccess(profile);
      }
      onClose();
    } catch (err: any) {
      console.error('Apple Auth Error:', err);
      if (err?.code === 'auth/operation-not-allowed' || err?.message?.includes('operation-not-allowed')) {
        setAuthError('Apple Girişi Firebase konsolunda Apple Developer Team ID ile etkinleştirilmelidir. Test için Google Girişini kullanabilirsiniz.');
      } else if (err?.code !== 'auth/popup-closed-by-user') {
        setAuthError(err?.message || 'Apple hesabı ile bağlanma başarısız oldu.');
      }
    } finally {
      setIsAppleAuthenticating(false);
    }
  };

  const handleUniPdSsoAuth = () => {
    setIsSsoAuthenticating(true);
    setAuthError(null);
    setTimeout(() => {
      setIsSsoAuthenticating(false);
      const studentEmail = email.trim() || (fullName.trim() ? `${fullName.trim().toLowerCase().replace(/\s+/g, '.')}@studenti.unipd.it` : 'studente@studenti.unipd.it');
      const studentName = fullName.trim() || 'UniPD Öğrencisi';
      const studentUsername = studentEmail.split('@')[0] || 'student';
      const isSuper = studentEmail === 'cnkborasimsek@gmail.com';
      
      if (onLoginSuccess) {
        onLoginSuccess({
          name: studentName,
          email: studentEmail,
          username: studentUsername,
          faculty: faculty || UNIPD_DEPARTMENTS[0]?.name || "DEI - Ingegneria dell'Informazione",
          studentIdVerified: true,
          ssoVerified: true,
          ssoProvider: 'UniPD Shibboleth IdP (Kurumsal SSO)',
          userHash: isSuper ? 'usr_unipd_master_001' : `usr_sso_${Date.now().toString().slice(-6)}`,
          role: isSuper ? 'superadmin' : 'student',
        });
      }
      onClose();
    }, 750);
  };

  // Resend countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (mode === 'sent' && countdown > 0) {
      setCanResend(false);
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [mode, countdown]);

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setAuthError('Lütfen e-posta ve şifrenizi giriniz.');
      return;
    }
    setIsSubmitting(true);
    setAuthError(null);
    setTimeout(() => {
      setIsSubmitting(false);
      const isUniPd = email.trim().endsWith('@studenti.unipd.it') || email.trim().endsWith('@unipd.it');
      const isSuper = email.trim() === 'cnkborasimsek@gmail.com';
      const namePart = email.split('@')[0].replace(/[._-]/g, ' ');
      const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
      
      if (onLoginSuccess) {
        onLoginSuccess({
          email: email.trim(),
          username: email.split('@')[0] || 'student',
          name: formattedName || 'Öğrenci',
          faculty: faculty || UNIPD_DEPARTMENTS[0]?.name || "DEI - Ingegneria dell'Informazione",
          studentIdVerified: isUniPd || isSuper,
          ssoVerified: isUniPd,
          userHash: isSuper ? 'usr_unipd_master_001' : `usr_login_${Date.now().toString().slice(-6)}`,
          role: isSuper ? 'superadmin' : 'student',
        });
      }
      onClose();
    }, 500);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !fullName.trim() || !password.trim()) {
      setAuthError('Lütfen ad soyad, e-posta ve şifre alanlarını eksiksiz doldurunuz.');
      return;
    }
    if (password.length < 6) {
      setAuthError('Şifreniz en az 6 karakter olmalıdır.');
      return;
    }
    setIsSubmitting(true);
    setAuthError(null);
    setTimeout(() => {
      setIsSubmitting(false);
      const isUniPd = email.trim().endsWith('@studenti.unipd.it') || email.trim().endsWith('@unipd.it');
      const isSuper = email.trim() === 'cnkborasimsek@gmail.com';
      const cleanUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_') || `user_${Date.now().toString().slice(-4)}`;
      const newHash = isSuper ? 'usr_unipd_master_001' : `usr_reg_${Date.now().toString().slice(-6)}`;

      if (onLoginSuccess) {
        onLoginSuccess({
          name: fullName.trim(),
          email: email.trim(),
          faculty: faculty.trim() || UNIPD_DEPARTMENTS[0]?.name || "DEI - Ingegneria dell'Informazione",
          username: cleanUsername,
          studentIdVerified: isUniPd || isSuper,
          ssoVerified: isUniPd,
          ssoProvider: isUniPd ? 'UniPD Kurumsal E-posta Doğrulaması' : 'Standart E-posta Kaydı',
          userHash: newHash,
          role: isSuper ? 'superadmin' : 'student',
        });
      }
      onClose();
    }, 600);
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setMode('sent');
      setCountdown(60);
      setCanResend(false);
    }, 700);
  };

  const handleResend = () => {
    if (!canResend) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setCountdown(60);
      setCanResend(false);
    }, 600);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-md rounded-2xl border border-stone-200 shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        id="modal-auth-flow"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/60">
          <div className="flex items-center gap-2">
            <span className="bg-orange-600 text-white p-1 rounded-lg text-xs">
              {mode === 'register' ? (
                <UserPlus className="w-4 h-4" />
              ) : mode === 'login' ? (
                <LogIn className="w-4 h-4" />
              ) : (
                <KeyRound className="w-4 h-4" />
              )}
            </span>
            <span className="font-bold text-sm text-stone-900 tracking-tight">
              {mode === 'register' ? t.registerNav : mode === 'login' ? t.loginNav : t.forgotPasswordNav}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
            aria-label={t.closeBtn}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Chat / Messaging Security Notice if triggered by messaging action */}
          {authReason === 'chat' && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-xs text-amber-950 animate-in fade-in duration-200">
              <div className="p-2 bg-amber-100 rounded-lg text-amber-700 shrink-0">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <strong className="block font-bold text-amber-900">
                  {currentLang === 'tr' ? 'Mesajlaşmak İçin Giriş Yapmalısınız' :
                   currentLang === 'it' ? 'Accesso Richiesto per Messaggiare' :
                   currentLang === 'de' ? 'Konto für Nachrichten erforderlich' :
                   currentLang === 'ru' ? 'Для сообщений требуется профиль' :
                   currentLang === 'hi' ? 'मैसेज करने के लिए लॉगिन आवश्यक है' :
                   'Account Required to Message'}
                </strong>
                <p className="text-[11px] text-amber-800 leading-snug">
                  {currentLang === 'tr' ? 'Padova güvenli öğrenci topluluğunda ilan sahipleri ve ev arkadaşlarıyla mesajlaşabilmek için onaylı bir hesaba ve profile sahip olmanız gerekmektedir.' :
                   currentLang === 'it' ? 'Per la sicurezza della comunità studentesca di Padova, per messaggiare con i coinquilini e proprietari è necessario un profilo attivo.' :
                   currentLang === 'de' ? 'Für die Sicherheit der Studenten in Padua ist ein aktives Profil erforderlich, um Nachrichten zu senden.' :
                   'To message listing owners and roommates safely in Padova, an active student profile is required.'}
                </p>
              </div>
            </div>
          )}
          
          {/* Create Listing Notice if triggered by creating a listing without being logged in */}
          {authReason === 'createListing' && (
            <div className="p-3.5 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-3 text-xs text-orange-950 animate-in fade-in duration-200">
              <div className="p-2 bg-orange-100 rounded-lg text-orange-700 shrink-0">
                <UserPlus className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <strong className="block font-bold text-orange-900">
                  {currentLang === 'tr' ? 'İlan Oluşturmak İçin Kayıt Olmalısınız' :
                   currentLang === 'it' ? 'Registrazione Richiesta per Creare un Annuncio' :
                   currentLang === 'de' ? 'Registrierung erforderlich, um ein Inserat zu erstellen' :
                   currentLang === 'ru' ? 'Для создания объявления требуется регистрация' :
                   currentLang === 'hi' ? 'विज्ञापन बनाने के लिए पंजीकरण आवश्यक है' :
                   'Registration Required to Create a Listing'}
                </strong>
                <p className="text-[11px] text-orange-800 leading-snug">
                  {currentLang === 'tr' ? 'Padova güvenli öğrenci ağına yeni bir oda veya ev ilanı ekleyebilmek için lütfen kayıt olun veya hesabınıza giriş yapın.' :
                   currentLang === 'it' ? 'Per aggiungere un nuovo annuncio di stanza o alloggio nella rete studentesca di Padova, registrati o accedi con il tuo account.' :
                   currentLang === 'de' ? 'Um ein neues Zimmer- oder Wohnungsangebot im Paduaner Studentennetzwerk aufzugeben, registrieren Sie sich bitte oder melden Sie sich an.' :
                   currentLang === 'ru' ? 'Чтобы добавить новое объявление о комнате или квартире в сеть студентов Падуи, пожалуйста, зарегистрируйтесь или войдите в систему.' :
                   currentLang === 'hi' ? 'पदुवा छात्र नेटवर्क में नया कमरा या आवास विज्ञापन जोड़ने के लिए, कृपया पंजीकरण करें या लॉगिन करें।' :
                   'To publish a new room or housing listing in the Padova student network, please register or sign in to your account.'}
                </p>
              </div>
            </div>
          )}

          {/* VIEW 1: LOGIN */}
          {mode === 'login' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-stone-900 tracking-tight">
                  {t.loginTitle}
                </h3>
                <p className="text-xs text-stone-500">
                  {t.loginSubtitle}
                </p>
              </div>

              {/* SUBSECTION: UNIPD AUTH */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-stone-700 font-bold text-xs uppercase tracking-wider">
                    <GraduationCap className="w-4 h-4 text-orange-600" />
                    <span>{authI18n.unipdAuthSectionTitle}</span>
                  </div>
                  <div className="h-px bg-stone-200 flex-1" />
                </div>

                {/* UNIPD SHIBBOLETH SSO INSTITUTIONAL AUTH */}
                <div className="p-3.5 bg-[#fdf2f4] border border-[#f3ccd2] rounded-2xl space-y-2.5 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="h-10 px-2.5 bg-white border border-[#edd2d6] rounded-xl flex items-center justify-center shadow-2xs">
                      <img
                        src="https://shibidp.cca.unipd.it/idp/images/unipd_files/logo.png"
                        alt="Università degli Studi di Padova"
                        className="h-7 w-auto object-contain max-w-[130px]"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <div>
                      <span className="font-bold text-xs sm:text-sm text-[#7a0d1a] block leading-tight">{authI18n.ssoLoginTitle}</span>
                      <span className="text-[10px] text-[#9b0014]/80">Università degli Studi di Padova</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleUniPdSsoAuth}
                    disabled={isSsoAuthenticating}
                    id="btn-auth-unipd-sso-login"
                    className="w-full bg-[#9b0014] hover:bg-[#830011] active:bg-[#68000d] text-white min-h-[44px] rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2.5 shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {isSsoAuthenticating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-rose-200" />
                        <span>{authI18n.ssoLoginLoading}</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-rose-200" />
                        <span>{authI18n.ssoLoginBtn}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Error Banner */}
              {authError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="leading-snug">{authError}</span>
                </div>
              )}

              {/* FIREBASE AUTH PROVIDERS: GOOGLE & APPLE SIGN-IN */}
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Google Sign-in */}
                  <button
                    type="button"
                    onClick={handleGoogleAuth}
                    disabled={isGoogleAuthenticating || isAppleAuthenticating}
                    id="btn-auth-google-login"
                    className="w-full bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 min-h-[42px] px-3 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2.5 shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    {isGoogleAuthenticating ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-stone-600" />
                        <span>Google...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                          <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                        </svg>
                        <span className="truncate">{authI18n.googleLogin}</span>
                      </>
                    )}
                  </button>

                  {/* Apple Sign-in */}
                  <button
                    type="button"
                    onClick={handleAppleAuth}
                    disabled={isGoogleAuthenticating || isAppleAuthenticating}
                    id="btn-auth-apple-login"
                    className="w-full bg-black hover:bg-stone-900 text-white min-h-[42px] px-3 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2.5 shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    {isAppleAuthenticating ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                        <span>Apple...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 170 170">
                          <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.08-7.7-7.94-12.04-14.59-6.96-10.74-12.44-23.2-16.44-37.38-4-14.18-6.01-27.17-6.01-38.97 0-14.67 3.51-26.79 10.53-36.36 7.02-9.57 15.75-14.46 26.19-14.68 4.67 0 9.87 1.25 15.61 3.75 5.74 2.5 9.77 3.82 12.09 3.96 1.74-.14 5.99-1.53 12.75-4.18 6.76-2.65 12.18-3.83 16.27-3.54 12.7.74 22.88 5.78 30.54 15.12-11.08 6.75-16.51 16.14-16.3 28.16.21 9.47 3.86 17.51 10.95 24.12 7.09 6.61 15.42 10.33 24.98 11.16-2.07 6.42-4.66 13.06-7.78 19.92zM119.22 31.81c0-7.39 2.66-14.42 7.98-21.09 5.32-6.67 11.89-10.72 19.7-12.15.54 2.61.82 5.08.82 7.42 0 7.39-2.73 14.53-8.19 21.41-5.46 6.88-12.03 10.82-19.71 11.82-.44-2.61-.6-5.08-.6-7.41z"/>
                        </svg>
                        <span className="truncate">{authI18n.appleLogin}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-stone-200"></div>
                <span className="flex-shrink mx-3 text-[11px] font-medium text-stone-400">{authI18n.orEmailLogin}</span>
                <div className="flex-grow border-t border-stone-200"></div>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-3.5 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-stone-700">
                    {t.emailLabel}
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="ad.soyad@studenti.unipd.it"
                      className="w-full min-h-[44px] px-3.5 pl-10 text-xs sm:text-sm border border-stone-300 rounded-xl bg-white text-stone-900 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    />
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-stone-700">
                    {t.passwordLabel}
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full min-h-[44px] px-3.5 pl-10 text-xs sm:text-sm border border-stone-300 rounded-xl bg-white text-stone-900 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    />
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 text-stone-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded text-orange-600 focus:ring-orange-500"
                    />
                    <span>{t.rememberMe}</span>
                  </label>

                  {/* Şifremi Unuttum Trigger */}
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    id="btn-forgot-password-link"
                    className="font-semibold text-orange-600 hover:text-orange-700 hover:underline cursor-pointer"
                  >
                    {t.forgotPasswordNav}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  id="btn-auth-submit-login"
                  className="w-full bg-stone-900 hover:bg-stone-800 text-white min-h-[44px] rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{t.loginBtn}...</span>
                    </>
                  ) : (
                    <span>{t.loginBtn}</span>
                  )}
                </button>
              </form>

              {/* Switch to Register */}
              <div className="pt-2 text-center border-t border-stone-100">
                <p className="text-xs text-stone-500">
                  {t.noAccount}{' '}
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    id="btn-switch-to-register"
                    className="font-bold text-orange-600 hover:text-orange-700 hover:underline cursor-pointer ml-1"
                  >
                    {t.registerNav}
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* VIEW 2: REGISTER (KAYIT OL) */}
          {mode === 'register' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-stone-900 tracking-tight">
                  {t.registerNav}
                </h3>
                <p className="text-xs text-stone-500">
                  {t.registerSubtitle}
                </p>
              </div>

              {/* SUBSECTION: UNIPD AUTH */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-stone-700 font-bold text-xs uppercase tracking-wider">
                    <GraduationCap className="w-4 h-4 text-orange-600" />
                    <span>{authI18n.unipdAuthSectionTitle}</span>
                  </div>
                  <div className="h-px bg-stone-200 flex-1" />
                </div>

                {/* UNIPD SHIBBOLETH SSO INSTITUTIONAL REGISTRATION */}
                <div className="p-3.5 bg-[#fdf2f4] border border-[#f3ccd2] rounded-2xl space-y-2.5 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="h-10 px-2.5 bg-white border border-[#edd2d6] rounded-xl flex items-center justify-center shadow-2xs">
                      <img
                        src="https://shibidp.cca.unipd.it/idp/images/unipd_files/logo.png"
                        alt="Università degli Studi di Padova"
                        className="h-7 w-auto object-contain max-w-[130px]"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <div>
                      <span className="font-bold text-xs sm:text-sm text-[#7a0d1a] block leading-tight">{authI18n.ssoRegisterTitle}</span>
                      <span className="text-[10px] text-[#9b0014]/80">Università degli Studi di Padova</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleUniPdSsoAuth}
                    disabled={isSsoAuthenticating}
                    id="btn-auth-unipd-sso-register"
                    className="w-full bg-[#9b0014] hover:bg-[#830011] active:bg-[#68000d] text-white min-h-[44px] rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2.5 shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {isSsoAuthenticating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-rose-200" />
                        <span>{authI18n.ssoRegisterLoading}</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-rose-200" />
                        <span>{authI18n.ssoRegisterBtn}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Error Banner */}
              {authError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="leading-snug">{authError}</span>
                </div>
              )}

              {/* FIREBASE AUTH PROVIDERS: GOOGLE & APPLE SIGN-IN */}
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Google Sign-in */}
                  <button
                    type="button"
                    onClick={handleGoogleAuth}
                    disabled={isGoogleAuthenticating || isAppleAuthenticating}
                    id="btn-auth-google-register"
                    className="w-full bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 min-h-[42px] px-3 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2.5 shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    {isGoogleAuthenticating ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-stone-600" />
                        <span>Google...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                          <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                        </svg>
                        <span className="truncate">{authI18n.googleRegister}</span>
                      </>
                    )}
                  </button>

                  {/* Apple Sign-in */}
                  <button
                    type="button"
                    onClick={handleAppleAuth}
                    disabled={isGoogleAuthenticating || isAppleAuthenticating}
                    id="btn-auth-apple-register"
                    className="w-full bg-black hover:bg-stone-900 text-white min-h-[42px] px-3 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2.5 shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    {isAppleAuthenticating ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                        <span>Apple...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 170 170">
                          <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.08-7.7-7.94-12.04-14.59-6.96-10.74-12.44-23.2-16.44-37.38-4-14.18-6.01-27.17-6.01-38.97 0-14.67 3.51-26.79 10.53-36.36 7.02-9.57 15.75-14.46 26.19-14.68 4.67 0 9.87 1.25 15.61 3.75 5.74 2.5 9.77 3.82 12.09 3.96 1.74-.14 5.99-1.53 12.75-4.18 6.76-2.65 12.18-3.83 16.27-3.54 12.7.74 22.88 5.78 30.54 15.12-11.08 6.75-16.51 16.14-16.3 28.16.21 9.47 3.86 17.51 10.95 24.12 7.09 6.61 15.42 10.33 24.98 11.16-2.07 6.42-4.66 13.06-7.78 19.92zM119.22 31.81c0-7.39 2.66-14.42 7.98-21.09 5.32-6.67 11.89-10.72 19.7-12.15.54 2.61.82 5.08.82 7.42 0 7.39-2.73 14.53-8.19 21.41-5.46 6.88-12.03 10.82-19.71 11.82-.44-2.61-.6-5.08-.6-7.41z"/>
                        </svg>
                        <span className="truncate">{authI18n.appleRegister}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-stone-200"></div>
                <span className="flex-shrink mx-3 text-[11px] font-medium text-stone-400">{authI18n.orEmailRegister}</span>
                <div className="flex-grow border-t border-stone-200"></div>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-3 pt-1">
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-stone-700">
                    {t.fullNameLabel} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      placeholder="Ad Soyad"
                      className="w-full min-h-[42px] px-3.5 pl-10 text-xs sm:text-sm border border-stone-300 rounded-xl bg-white text-stone-900 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    />
                    <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-stone-700">
                    {t.emailLabel} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="ad.soyad@studenti.unipd.it"
                      className="w-full min-h-[42px] px-3.5 pl-10 text-xs sm:text-sm border border-stone-300 rounded-xl bg-white text-stone-900 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    />
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* Faculty / UniPD Department Selection */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-stone-700">
                      {t.facultyLabel} (UniPD Resmi Departmanları)
                    </label>
                    <span className="text-[10px] text-orange-600 font-bold">32 Departman</span>
                  </div>
                  <div className="relative">
                    <select
                      id="select-register-faculty"
                      value={faculty}
                      onChange={(e) => setFaculty(e.target.value)}
                      className="w-full min-h-[42px] px-3.5 pl-10 pr-9 text-xs sm:text-sm border border-stone-300 rounded-xl bg-white text-stone-900 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 appearance-none cursor-pointer"
                    >
                      {Array.from(new Set(UNIPD_DEPARTMENTS.map((d) => d.school))).map((school) => (
                        <optgroup key={school} label={`🏛️ ${school}`}>
                          {UNIPD_DEPARTMENTS.filter((d) => d.school === school).map((dep) => (
                            <option key={dep.code} value={dep.name}>
                              {dep.name}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    <BookOpen className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <ChevronDown className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <p className="text-[11px] text-stone-400">
                    Öğrenim gördüğünüz veya araştırma yaptığınız UniPD departmanını seçin.
                  </p>
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-stone-700">
                    {t.passwordLabel} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full min-h-[42px] px-3.5 pl-10 text-xs sm:text-sm border border-stone-300 rounded-xl bg-white text-stone-900 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    />
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  id="btn-auth-submit-register"
                  className="w-full bg-orange-600 hover:bg-orange-500 text-white min-h-[44px] rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-3"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{t.registerBtn}...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>{t.registerBtn}</span>
                    </>
                  )}
                </button>
              </form>

              {/* Switch to Login */}
              <div className="pt-2 text-center border-t border-stone-100">
                <p className="text-xs text-stone-500">
                  {t.haveAccount}{' '}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    id="btn-switch-to-login"
                    className="font-bold text-orange-600 hover:text-orange-700 hover:underline cursor-pointer ml-1"
                  >
                    {t.loginNav}
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* VIEW 3: FORGOT PASSWORD FLOW */}
          {mode === 'forgot' && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-xs font-semibold text-stone-500 hover:text-stone-800 flex items-center gap-1 cursor-pointer transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t.backToLoginBtn}</span>
              </button>

              <div className="space-y-1.5">
                <div className="w-11 h-11 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-1">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-stone-900 tracking-tight">
                  {t.forgotPasswordTitle}
                </h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  {t.forgotPasswordSubtitle}
                </p>
              </div>

              <form onSubmit={handleForgotSubmit} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-stone-800">
                    {t.forgotPasswordEmailLabel} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder={t.forgotPasswordEmailPlaceholder}
                      className="w-full min-h-[44px] px-3.5 pl-10 text-xs sm:text-sm border border-stone-300 rounded-xl bg-white text-stone-900 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    />
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  id="btn-send-reset-link"
                  className="w-full bg-orange-600 hover:bg-orange-500 text-white min-h-[44px] rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{t.sendingResetLink}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{t.sendResetLinkBtn}</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* VIEW 4: RESET LINK SENT CONFIRMATION INTERFACE */}
          {mode === 'sent' && (
            <div className="space-y-5 text-center py-2 animate-in fade-in" id="modal-reset-link-sent-confirm">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-sm">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xl font-bold text-stone-900 tracking-tight">
                  {t.resetLinkSentTitle}
                </h3>
                <p className="text-xs text-stone-500 leading-relaxed max-w-sm mx-auto">
                  {t.resetLinkSentSubtitle}
                </p>
              </div>

              {/* Sent target email badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-100 border border-stone-200 text-xs font-bold text-stone-800">
                <Mail className="w-3.5 h-3.5 text-stone-500" />
                <span>{email}</span>
              </div>

              {/* Note / instructions box */}
              <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-left text-xs text-amber-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Info className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Güvenlik Hatırlatması</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  {t.resetLinkSentNote}
                </p>
              </div>

              {/* Resend actions & countdown */}
              <div className="pt-2 space-y-3">
                <div className="text-xs text-stone-500">
                  {canResend ? (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={isSubmitting}
                      className="font-bold text-orange-600 hover:text-orange-700 hover:underline cursor-pointer disabled:opacity-50"
                    >
                      {t.resendResetLink}
                    </button>
                  ) : (
                    <span>
                      {countdown} {t.resendCountdown}
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-800 min-h-[42px] rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    {t.backToLoginBtn}
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 bg-stone-900 hover:bg-stone-800 text-white min-h-[42px] rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    {t.closeBtn}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

