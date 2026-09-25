import { useModalBehavior } from '../utils/useModalBehavior';
import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Upload, 
  Lock, 
  User, 
  Check, 
  Eye, 
  EyeOff, 
  Camera, 
  ShieldCheck, 
  AlertCircle,
  RefreshCw,
  GraduationCap,
  ChevronDown,
  BookOpen,
  Trash2
} from 'lucide-react';
import { Language, UserProfile } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { UNIPD_DEPARTMENTS } from '../data/unipdDepartments';
import { uploadProfilePhoto, describeUploadError, isAllowedImageType } from '../services/storageService';
import { updateUserProfilePhoto, deleteMyAccount } from '../services/supabaseService';
import { clearLocalData, LOCAL_DATA_GROUPS } from '../utils/localData';
import { LANG_LOCALE } from '../utils/locale';
import { Link } from 'react-router-dom';
import { supabase, changePassword, describeAuthError } from '../lib/supabase';
import { UsernameField, UsernameStatus } from './UsernameField';
import { normalizeUsername } from '../utils/username';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onChangeUsername: (username: string) => Promise<'ok' | 'taken' | 'invalid'>;
  currentLang?: Language;
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateProfile,
  onChangeUsername,
  currentLang = 'it',
}) => {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.it;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'department' | 'username' | 'photo' | 'password' | 'account'>('department');

  // UniPD Department state
  const [selectedDepartment, setSelectedDepartment] = useState<string>(
    currentUser.faculty || UNIPD_DEPARTMENTS[0]?.name || ''
  );
  const [isSavingDepartment, setIsSavingDepartment] = useState(false);
  const [departmentSuccessMsg, setDepartmentSuccessMsg] = useState(false);

  useEffect(() => {
    if (currentUser.faculty) {
      setSelectedDepartment(currentUser.faculty);
    }
  }, [currentUser.faculty, isOpen]);

  // Username state
  const [usernameInput, setUsernameInput] = useState(currentUser.username);
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('unchanged');
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [usernameSuccessMsg, setUsernameSuccessMsg] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  // Modal her açıldığında mesajlar sıfırlanır; kayıttan sonra kullanıcı adı değişince başarı mesajı silinmemeli.
  useEffect(() => {
    if (isOpen) {
      setUsernameSuccessMsg(false);
      setUsernameError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    setUsernameInput(currentUser.username);
  }, [currentUser.username, isOpen]);

  // Account deletion state
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Photo state
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [photoSuccessMsg, setPhotoSuccessMsg] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // Cleanup object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      if (previewPhoto && previewPhoto.startsWith('blob:')) {
        URL.revokeObjectURL(previewPhoto);
      }
    };
  }, [previewPhoto]);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useModalBehavior(isOpen, onClose);

  if (!isOpen) return null;

  // Handle image file selection (uses lightweight blob URL instead of memory-heavy Base64)
  const handleFileChange = (file: File | null) => {
    setPhotoError(null);
    setPhotoSuccessMsg(false);

    if (!file) return;

    if (!isAllowedImageType(file.type)) {
      setPhotoError(t.errNotImage);
      return;
    }

    // 10MB limit before client compression
    if (file.size > 10 * 1024 * 1024) {
      setPhotoError(t.errImageTooBig);
      return;
    }

    // Clean up previous blob URL
    if (previewPhoto && previewPhoto.startsWith('blob:')) {
      URL.revokeObjectURL(previewPhoto);
    }

    const objectUrl = URL.createObjectURL(file);
    setPhotoFile(file);
    setPreviewPhoto(objectUrl);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSavePhoto = async () => {
    if (!photoFile) {
      setPhotoError(t.errPickPhotoFirst);
      return;
    }

    setIsSavingPhoto(true);
    setPhotoError(null);
    setUploadProgress(0);

    try {
      // 1. Upload to Supabase Storage (compressed client-side, returning secure HTTPS URL)
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const userId = currentUser.id || authUser?.id;
      if (!userId) throw Object.assign(new Error('Sign in to upload.'), { code: 'upload/need-login' });
      const downloadUrl = await uploadProfilePhoto(photoFile, userId, (progress) => {
        setUploadProgress(progress);
      });

      // 2. Update local state and app state with HTTPS URL (never Base64)
      onUpdateProfile({ avatar: downloadUrl, photoURL: downloadUrl });

      // 3. Update profile row
      await updateUserProfilePhoto(userId, downloadUrl).catch((err) => {
        console.warn('Profile photo sync warning:', err);
      });

      // 4. Update Supabase Auth user metadata photoURL if logged in
      if (authUser) {
        await supabase.auth.updateUser({ data: { avatar_url: downloadUrl } }).catch((err) => {
          console.warn('Supabase Auth avatar_url update warning:', err);
        });
      }

      // 5. Cleanup preview blob
      if (previewPhoto && previewPhoto.startsWith('blob:')) {
        URL.revokeObjectURL(previewPhoto);
      }

      setPhotoSuccessMsg(true);
      setPreviewPhoto(null);
      setPhotoFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      console.error('Failed to upload profile photo:', err);
      setPhotoError(describeUploadError(err, currentLang));
    } finally {
      setIsSavingPhoto(false);
      setUploadProgress(0);
    }
  };

  const handleSaveUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingUsername || usernameStatus !== 'available') return;
    setIsSavingUsername(true);
    setUsernameError(null);
    setUsernameSuccessMsg(false);
    try {
      const result = await onChangeUsername(normalizeUsername(usernameInput));
      if (result === 'ok') setUsernameSuccessMsg(true);
      else setUsernameError(result === 'taken' ? t.usernameTaken : t.usernameInvalid);
    } catch (err) {
      console.warn('Could not save username:', err);
      setUsernameError(t.usernameSaveFail);
    } finally {
      setIsSavingUsername(false);
    }
  };

  const confirmWord = t.deleteConfirmWord;
  const canDeleteAccount =
    deleteConfirm.trim().toLocaleUpperCase(LANG_LOCALE[currentLang]) === confirmWord.toLocaleUpperCase(LANG_LOCALE[currentLang]);

  // GDPR md. 17: hesap ve tüm veriler sunucuda silinir, ardından bu tarayıcıdaki yerel veriler ve oturum temizlenir.
  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canDeleteAccount || isDeleting) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const result = await deleteMyAccount();
      if (result === 'superadmin') {
        setDeleteError(t.deleteSuperadminBlocked);
        return;
      }
      clearLocalData(LOCAL_DATA_GROUPS.map((g) => g.id));
      await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
      try {
        sessionStorage.setItem('padova_account_deleted', '1');
      } catch {
        // gizli modda yazılamayabilir; yalnızca bilgi mesajı kaybolur
      }
      window.location.assign('/');
    } catch (err) {
      console.warn('Account deletion failed:', err);
      setDeleteError(t.deleteAccountFail);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearPhotoSelection = () => {
    if (previewPhoto && previewPhoto.startsWith('blob:')) {
      URL.revokeObjectURL(previewPhoto);
    }
    setPreviewPhoto(null);
    setPhotoFile(null);
    setPhotoError(null);
    setPhotoSuccessMsg(false);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Password strength helper
  const getPasswordStrength = (pass: string): { score: number; label: string; color: string } => {
    if (!pass) return { score: 0, label: '', color: 'bg-stone-200' };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, label: t.passwordStrengthWeak, color: 'bg-rose-500' };
    if (score <= 3) return { score: 2, label: t.passwordStrengthMedium, color: 'bg-amber-500' };
    return { score: 3, label: t.passwordStrengthStrong, color: 'bg-emerald-600' };
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccessMsg(false);

    if (!currentPassword.trim()) {
      setPasswordError(t.passwordCurrentRequired);
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError(t.passwordMinLengthError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(t.passwordMismatchError);
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSuccessMsg(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(describeAuthError(err, currentLang));
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleSaveDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingDepartment(true);
    setDepartmentSuccessMsg(false);

    setTimeout(() => {
      onUpdateProfile({ faculty: selectedDepartment });
      setIsSavingDepartment(false);
      setDepartmentSuccessMsg(true);
      setTimeout(() => {
        setDepartmentSuccessMsg(false);
      }, 4000);
    }, 500);
  };

  const passStrength = getPasswordStrength(newPassword);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-xl rounded-2xl border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
        id="modal-profile-settings"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/50">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
              {t.profileSettingsTitle}
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              {t.profileSettingsSubtitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
            aria-label={t.closeBtn}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-stone-200 bg-stone-50/70 p-1.5 gap-1.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('department');
              setPhotoSuccessMsg(false);
              setPasswordSuccessMsg(false);
              setDepartmentSuccessMsg(false);
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'department'
                ? 'bg-white text-orange-600 shadow-xs font-bold border border-stone-200'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>{t.profileTabDepartment}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('username');
              setPhotoSuccessMsg(false);
              setPasswordSuccessMsg(false);
              setDepartmentSuccessMsg(false);
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'username'
                ? 'bg-white text-orange-600 shadow-xs font-bold border border-stone-200'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
            }`}
          >
            <User className="w-4 h-4" />
            <span>{t.profileTabUsername}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('photo');
              setPhotoSuccessMsg(false);
              setPasswordSuccessMsg(false);
              setDepartmentSuccessMsg(false);
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'photo'
                ? 'bg-white text-orange-600 shadow-xs font-bold border border-stone-200'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>{t.profileTabPhoto}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('account');
              setPhotoSuccessMsg(false);
              setPasswordSuccessMsg(false);
              setDepartmentSuccessMsg(false);
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'account'
                ? 'bg-white text-rose-600 shadow-xs font-bold border border-stone-200'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>{t.profileTabAccount}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('password');
              setPhotoSuccessMsg(false);
              setPasswordSuccessMsg(false);
              setDepartmentSuccessMsg(false);
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'password'
                ? 'bg-white text-orange-600 shadow-xs font-bold border border-stone-200'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>{t.profileTabPassword}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* TAB: UniPD Departman & Fakülte Seçimi */}
          {activeTab === 'department' && (
            <form onSubmit={handleSaveDepartment} className="space-y-5">
              {/* Current Department Status */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-stone-50 border border-stone-200">
                <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 shadow-xs">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-stone-900">{t.currentDept}</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      UniPD
                    </span>
                  </div>
                  <p className="text-xs text-orange-600 font-semibold truncate">
                    {currentUser.faculty || t.notSelected}
                  </p>
                  <p className="text-[11px] text-stone-500 truncate">
                    @{currentUser.username} • {currentUser.email}
                  </p>
                </div>
              </div>

              {/* Success Notification */}
              {departmentSuccessMsg && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-900 animate-in fade-in">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">
                    {t.deptUpdated}
                  </span>
                </div>
              )}

              {/* Department Dropdown Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-stone-800 uppercase tracking-wide">
                    {t.officialDeptTitle}
                  </label>
                  <span className="text-[11px] text-stone-400 font-medium">{t.schools8}</span>
                </div>

                <div className="relative">
                  <select
                    id="select-profile-department"
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="w-full min-h-[48px] px-3.5 pl-10 pr-9 text-xs sm:text-sm border border-stone-300 rounded-xl bg-white text-stone-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 appearance-none cursor-pointer shadow-2xs font-medium"
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
                  <ChevronDown className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Selected Department Details Card */}
                {(() => {
                  const currentObj = UNIPD_DEPARTMENTS.find(d => d.name === selectedDepartment);
                  if (!currentObj) return null;
                  return (
                    <div className="p-3 bg-orange-50/50 border border-orange-200/70 rounded-xl text-xs space-y-1 mt-2">
                      <div className="flex items-center justify-between text-orange-950 font-bold">
                        <span>{currentObj.school}</span>
                        <span className="bg-orange-200/80 text-orange-900 px-2 py-0.5 rounded-md text-[10px] uppercase font-mono">
                          {t.codeLabel}: {currentObj.code}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-600">
                        {currentObj.englishName}
                      </p>
                    </div>
                  );
                })()}

                <p className="text-[11px] text-stone-400 leading-relaxed pt-1">
                  {t.deptMatchNote}
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-3 border-t border-stone-100 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingDepartment || selectedDepartment === currentUser.faculty}
                  className="bg-orange-600 hover:bg-orange-500 text-white min-h-[44px] px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isSavingDepartment ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{t.savingDots}</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{t.updateDept}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB: Hesap (silme) */}
          {activeTab === 'account' && (
            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/60 space-y-3">
                <h4 className="text-sm font-bold text-rose-900">{t.deleteAccountTitle}</h4>
                <p className="text-xs text-rose-900/90 leading-relaxed">{t.deleteAccountIntro}</p>
                <ul className="list-disc pl-5 space-y-1 text-xs text-stone-700 leading-relaxed">
                  {t.deleteAccountItems.split('|').map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <p className="pt-1 text-xs font-semibold text-rose-900/90 leading-relaxed">{t.deleteAccountRetainedIntro}</p>
                <ul className="list-disc pl-5 space-y-1 text-xs text-stone-700 leading-relaxed">
                  {t.deleteAccountRetainedItems.split('|').map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="input-delete-confirm" className="block text-xs font-bold text-stone-800">
                  {t.deleteConfirmPrompt.replace('{word}', confirmWord)}
                </label>
                <input
                  id="input-delete-confirm"
                  type="text"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  className="w-full min-h-[44px] px-3.5 text-sm border border-stone-300 rounded-xl bg-white text-stone-900 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                />
              </div>

              {deleteError && (
                <div role="alert" className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-800">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="font-semibold">{deleteError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={!canDeleteAccount || isDeleting}
                className="w-full min-h-[46px] bg-rose-600 hover:bg-rose-700 disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition cursor-pointer"
              >
                {isDeleting ? t.deleteAccountWorking : t.deleteAccountBtn}
              </button>

              <Link to="/gizlilik" onClick={onClose} className="block text-center text-[11px] text-stone-500 hover:text-orange-700 underline">
                {t.privacyLinkInModal}
              </Link>
            </form>
          )}

          {/* TAB: Kullanıcı Adı */}
          {activeTab === 'username' && (
            <form onSubmit={handleSaveUsername} className="space-y-4">
              {usernameSuccessMsg && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-900 animate-in fade-in">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">{t.usernameSaved}</span>
                </div>
              )}
              {usernameError && (
                <div role="alert" className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-800">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="font-semibold">{usernameError}</span>
                </div>
              )}
              <UsernameField
                id="input-profile-username"
                value={usernameInput}
                onChange={(v) => {
                  setUsernameInput(v);
                  setUsernameSuccessMsg(false);
                  setUsernameError(null);
                }}
                status={usernameStatus}
                onStatusChange={setUsernameStatus}
                t={t}
                currentUsername={currentUser.username}
              />
              <p className="text-[11px] text-stone-500">{t.usernameChangeNote}</p>
              <button
                type="submit"
                disabled={isSavingUsername || usernameStatus !== 'available'}
                className="w-full min-h-[46px] bg-orange-600 hover:bg-orange-500 disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition cursor-pointer"
              >
                {t.usernameSaveBtn}
              </button>
            </form>
          )}

          {/* TAB 1: Profil Fotoğrafı */}
          {activeTab === 'photo' && (
            <div className="space-y-5">
              
              {/* Current Photo & Student Info */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-stone-50 border border-stone-200">
                <div className="relative">
                  <img
                    src={previewPhoto || currentUser.avatar}
                    alt={currentUser.name}
                    className="w-20 h-20 rounded-full object-cover border-2 border-orange-500 shadow-sm"
                  />
                  <span className="absolute -bottom-1 -right-1 bg-emerald-600 text-white p-1 rounded-full border-2 border-white shadow-xs" title={t.unipdVerifiedProfile}>
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </span>
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-stone-900 truncate">{currentUser.name}</h4>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      UniPD
                    </span>
                  </div>
                  <p className="text-xs text-orange-600 font-medium">@{currentUser.username}</p>
                  <p className="text-[11px] text-stone-500 truncate">{currentUser.email}</p>
                </div>
              </div>

              {/* Photo Success Banner */}
              {photoSuccessMsg && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-900 animate-in fade-in">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">{t.photoUpdatedSuccess}</span>
                </div>
              )}

              {/* Photo Error Banner */}
              {photoError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{photoError}</span>
                </div>
              )}

              {/* Upload Drag & Drop Area */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
                  isDragOver 
                    ? 'border-orange-500 bg-orange-50/50' 
                    : 'border-stone-300 hover:border-stone-400 bg-stone-50/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                />
                <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shadow-xs">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm font-bold text-stone-800">
                    {t.uploadNewPhotoBtn}
                  </p>
                  <p className="text-xs text-stone-500">
                    {t.dragDropPhotoHint}
                  </p>
                  <p className="text-[11px] text-stone-400 font-medium">
                    {t.photoFormatHint}
                  </p>
                </div>
              </div>

              {/* Preview & Action Buttons */}
              {previewPhoto && (
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-stone-700">{t.newPhotoPreview}:</span>
                    <img
                      src={previewPhoto}
                      alt={t.newPhotoAlt}
                      className="w-9 h-9 rounded-full object-cover border border-stone-300"
                    />
                    <button
                      type="button"
                      onClick={handleClearPhotoSelection}
                      className="text-xs text-stone-500 hover:text-stone-800 underline ml-2 cursor-pointer"
                    >
                      {t.removeSelection}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleSavePhoto}
                    disabled={isSavingPhoto}
                    className="bg-orange-600 hover:bg-orange-500 text-white min-h-[42px] px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSavingPhoto ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>{uploadProgress > 0 ? `%${uploadProgress} ${t.savingPhoto}` : t.savingPhoto}</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>{t.savePhotoBtn}</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Upload Progress Bar */}
              {isSavingPhoto && uploadProgress > 0 && (
                <div className="p-3 bg-orange-50/70 border border-orange-200/60 rounded-xl space-y-1.5 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs text-orange-900 font-semibold">
                    <span>{t.uploadingCloud}</span>
                    <span>%{uploadProgress}</span>
                  </div>
                  <div className="w-full h-1.5 bg-orange-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-600 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Şifre Değiştirme */}
          {activeTab === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              
              {/* Password Success Banner */}
              {passwordSuccessMsg && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-900 animate-in fade-in">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">{t.passwordUpdatedSuccess}</span>
                </div>
              )}

              {/* Password Error Banner */}
              {passwordError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              {/* Current Password Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-stone-800">
                  {t.currentPasswordLabel} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder={t.currentPasswordPlaceholder}
                    required
                    className="w-full min-h-[44px] px-3.5 pr-10 text-xs sm:text-sm border border-stone-300 rounded-xl bg-white text-stone-900 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-stone-800">
                  {t.newPasswordLabel} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t.newPasswordPlaceholder}
                    required
                    minLength={8}
                    className="w-full min-h-[44px] px-3.5 pr-10 text-xs sm:text-sm border border-stone-300 rounded-xl bg-white text-stone-900 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Meter */}
                {newPassword && (
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-stone-500">{t.securityLevel}:</span>
                      <span className="font-bold text-stone-700">{passStrength.label}</span>
                    </div>
                    <div className="h-1.5 w-full bg-stone-200 rounded-full overflow-hidden flex gap-1">
                      <div className={`h-full flex-1 rounded-full ${passStrength.score >= 1 ? passStrength.color : 'bg-transparent'}`} />
                      <div className={`h-full flex-1 rounded-full ${passStrength.score >= 2 ? passStrength.color : 'bg-transparent'}`} />
                      <div className={`h-full flex-1 rounded-full ${passStrength.score >= 3 ? passStrength.color : 'bg-transparent'}`} />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm New Password Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-stone-800">
                  {t.confirmPasswordLabel} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t.confirmPasswordPlaceholder}
                    required
                    minLength={8}
                    className="w-full min-h-[44px] px-3.5 pr-10 text-xs sm:text-sm border border-stone-300 rounded-xl bg-white text-stone-900 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-stone-400 leading-relaxed">
                {t.passwordHint}
              </p>

              {/* Submit Button */}
              <div className="pt-3 border-t border-stone-100 flex justify-end">
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="bg-stone-900 hover:bg-stone-800 text-white min-h-[44px] px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isUpdatingPassword ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{t.updatingPassword}</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>{t.updatePasswordBtn}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
