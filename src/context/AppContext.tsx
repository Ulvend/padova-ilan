import React, { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  FilterState,
  HousingListing,
  Language,
  ConversationContact,
  DirectMessage,
  FirestoreMessage,
  UserProfile,
  UserNotification
} from '../types';
import {
  DEFAULT_GUEST_USER,
  resolveListingCoords,
} from '../data/mockData';
import { TRANSLATIONS } from '../utils/translations';
import { LANG_LOCALE } from '../utils/wizardText';
import { formatDeviceTime } from '../utils/deviceTime';
import { evaluateFairPrice } from '../utils/fairPrice';
import { isSuperAdminEmail } from '../config';
import {
  supabase,
  logOut,
  isUniPdVerifiedUser,
  requestUniPdEmailVerification,
  resendVerificationEmail,
  reloadCurrentUser,
  describeAuthError,
} from '../lib/supabase';
import {
  getUserProfile,
  getPublicUserProfile,
  syncUserProfile,
  updateUserFavorites,
  saveListingToFirestore,
  updateListingInFirestore,
  deleteListingFromFirestore,
  subscribeToListings,
  subscribeToMessages,
  sendMessageToFirestore,
  markMessagesRead,
  subscribeToNotifications,
  saveNotificationToFirestore,
  markNotificationsRead,
  deleteNotificationFromFirestore,
  subscribeToAdminStatus,
  subscribeToAdminGrants,
  grantAdmin,
  revokeAdmin,
  PublicUserProfile,
} from '../services/supabaseService';

export const DEFAULT_FILTERS: FilterState = {
  categoryTab: 'all',
  searchQuery: '',
  contractType: 'all',
  district: 'all',
  maxPrice: 900,
  onlyVideoTour: false,
  onlyStudentVerified: false,
  onlyHighCompatibility: false,
  roomType: 'all',
  sortBy: 'relevance',
};

// Önceki sürümlerin tarayıcıda tuttuğu, artık Firestore'dan gelen veriler.
const LEGACY_STORAGE_KEYS = [
  'padova_current_user_v2',
  'padova_is_logged_in_v2',
  'padova_housing_conversations_v5',
  'padova_housing_archived_listings',
  'padova_authorized_admin_hashes',
  'padova_user_notifications_v2',
];

const LISTINGS_CACHE_KEY = 'padova_housing_listings_cache_v3';
const FAVORITES_KEY = 'padova_housing_favorites_v2';

const safeStorageGet = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeStorageSet = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Kota dolu veya depolama kapalı; önbellek isteğe bağlı olduğu için yok sayılır.
  }
};

// Supabase kullanıcısının render'ı tetikleyecek anlık görüntüsü.
// (session.user aynı nesne olarak değiştiği için doğrudan state'e konamaz.)
interface AuthSnapshot {
  uid: string;
  email: string;
  emailVerified: boolean;
  displayName: string;
  photoURL: string;
  unipdVerified: boolean;
}

export type ToastMessage = { id: number; type: 'error' | 'success' | 'info'; text: string };

interface AppContextType {
  // Language & Translations
  currentLang: Language;
  setCurrentLang: (lang: Language) => void;
  t: typeof TRANSLATIONS['tr'];

  // Auth & Profile
  currentUser: UserProfile;
  isLoggedIn: boolean;
  authReady: boolean;
  emailVerified: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  handleLoginSuccess: (userData?: Partial<UserProfile>) => void;
  handleLogout: () => void;
  handleUpdateProfile: (updated: Partial<UserProfile>) => void;
  handleRequestUniPdVerification: (unipdEmail: string) => Promise<void>;
  handleResendVerificationEmail: () => Promise<void>;
  handleRefreshVerification: () => Promise<boolean>;
  authorizedAdminHashes: string[];
  handleGrantAdminHash: (uid: string, note?: string) => Promise<void>;
  handleRevokeAdminHash: (uid: string) => Promise<void>;

  // Listings & Favorites
  listings: HousingListing[];
  archivedListings: HousingListing[];
  favoriteIds: string[];
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  filteredListings: HousingListing[];
  myListings: HousingListing[];
  handleAddListing: (newListing: HousingListing) => Promise<void>;
  handleUpdateListing: (listingId: string, updates: Partial<HousingListing>) => Promise<void>;
  handleDeleteListing: (id: string) => void;
  handleToggleVerifyListing: (id: string) => void;
  handleToggleVideoVerified: (id: string) => void;
  handleUpdateListingPrice: (id: string, newPrice: number) => void;
  handleMarkListingAsRented: (listingId: string, details?: { rentedPrice: number; tenantType: string; note?: string }) => void;
  handleReactivateListing: (listingId: string) => void;
  handleToggleFavorite: (e?: React.MouseEvent, listingId?: string) => void;
  editingListing: HousingListing | null;
  setEditingListing: (listing: HousingListing | null) => void;
  handleOpenEditListingModal: (listing: HousingListing) => void;

  // Conversations & Chat
  conversations: ConversationContact[];
  activeConversationId: string;
  setActiveConversationId: (id: string) => void;
  handleSendMessage: (conversationIdOrText: string, maybeText?: string) => void;
  handleOpenChat: (username: string, subject: string, listingId?: string) => void;
  unreadMessagesCount: number;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;

  // Notifications
  notifications: UserNotification[];
  unreadNotificationsCount: number;
  handleMarkAllNotificationsRead: () => void;
  handleDeleteNotification: (id: string) => void;

  // Kullanıcıya gösterilen kısa hata/başarı mesajları
  toast: ToastMessage | null;
  showToast: (text: string, type?: ToastMessage['type']) => void;
  dismissToast: () => void;

  // UI & Layout
  gridLayout: 'double' | 'single';
  setGridLayout: (mode: 'double' | 'single') => void;
  isMapSectionOpen: boolean;
  setIsMapSectionOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isMobileFilterOpen: boolean;
  setIsMobileFilterOpen: (open: boolean) => void;

  // Modals
  videoModalListing: HousingListing | null;
  setVideoModalListing: (listing: HousingListing | null) => void;
  previewModalListing: HousingListing | null;
  setPreviewModalListing: (listing: HousingListing | null) => void;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
  handleOpenCreateListingModal: () => void;
  isProfileSettingsOpen: boolean;
  setIsProfileSettingsOpen: (open: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalMode: 'login' | 'register' | 'forgot';
  setAuthModalMode: (mode: 'login' | 'register' | 'forgot') => void;
  handleOpenAuthModal: (mode?: 'login' | 'register' | 'forgot', reason?: 'chat' | 'createListing' | 'default' | null) => void;
  authModalReason: 'chat' | 'createListing' | 'default' | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const withCoords = (listing: HousingListing, idx = 0): HousingListing => {
  if (typeof listing.lat === 'number' && typeof listing.lng === 'number' && listing.lat > 0 && listing.lng > 0) {
    return listing;
  }
  const [lat, lng] = resolveListingCoords(listing, idx);
  return { ...listing, lat, lng };
};

const createdAtMs = (listing: HousingListing) => {
  const ms = Date.parse(listing.createdAt);
  return isNaN(ms) ? 0 : ms;
};

// Sözleşme başlangıç filtresi: ilan oluştururken kaydedilen ISO tarihin ayına bakar.
const START_FILTER_MONTHS: Record<string, number[]> = {
  october: [10],
  november: [11],
  spring: [2],
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Language State
  const [currentLang, setCurrentLang] = useState<Language>(() => {
    const saved = safeStorageGet('padova_housing_lang');
    if (saved && ['tr', 'en', 'it', 'de', 'ru', 'hi'].includes(saved)) {
      return saved as Language;
    }
    return 'tr';
  });

  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.tr;

  // 2. Auth & User Profile State (tek doğruluk kaynağı Firebase Auth'tur)
  const [authUser, setAuthUser] = useState<AuthSnapshot | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profileExtras, setProfileExtras] = useState<Partial<UserProfile>>({});
  const [hasAdminGrant, setHasAdminGrant] = useState(false);
  const lastSyncedKey = useRef<string>('');

  const isLoggedIn = Boolean(authUser);
  const isSuperAdmin = Boolean(authUser?.emailVerified && isSuperAdminEmail(authUser.email));
  const isAdmin = isSuperAdmin || hasAdminGrant;

  const currentUser: UserProfile = useMemo(() => {
    if (!authUser) return DEFAULT_GUEST_USER;
    return {
      ...DEFAULT_GUEST_USER,
      ...profileExtras,
      id: authUser.uid,
      userHash: authUser.uid,
      email: authUser.email,
      name: profileExtras.name || authUser.displayName || authUser.email.split('@')[0] || t.defaultStudentName,
      username: profileExtras.username || authUser.email.split('@')[0] || 'student',
      avatar: profileExtras.avatar || authUser.photoURL || DEFAULT_GUEST_USER.avatar,
      studentIdVerified: authUser.unipdVerified,
      ssoVerified: authUser.unipdVerified,
      ssoProvider: authUser.unipdVerified ? 'UniPD e-posta doğrulaması' : undefined,
      role: isSuperAdmin ? 'superadmin' : hasAdminGrant ? 'admin' : 'student',
    };
  }, [authUser, profileExtras, isSuperAdmin, hasAdminGrant]);

  // 3. Listings State (Firestore gerçek zamanlı; açılışta son bilinen liste önbellekten gösterilir)
  const [allListings, setAllListings] = useState<HousingListing[]>(() => {
    const saved = safeStorageGet(LISTINGS_CACHE_KEY);
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  // 4. Messages State
  const [messages, setMessages] = useState<FirestoreMessage[]>([]);
  const [contactProfiles, setContactProfiles] = useState<Record<string, PublicUserProfile | null>>({});
  const [draftContacts, setDraftContacts] = useState<ConversationContact[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>('');

  // 5. Favorites State
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    const saved = safeStorageGet(FAVORITES_KEY);
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  // 6. Filter State
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  // 7. Admin grants (yalnızca ana admin listeler)
  const [adminGrantUids, setAdminGrantUids] = useState<string[]>([]);

  // 8. User Notifications
  const [notifications, setNotifications] = useState<UserNotification[]>([]);

  // 9. Toast
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const showToast = useCallback((text: string, type: ToastMessage['type'] = 'error') => {
    setToast({ id: Date.now(), type, text });
  }, []);
  const dismissToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  // 10. UI & Modal States
  const [gridLayout, setGridLayoutState] = useState<'double' | 'single'>(() => {
    return safeStorageGet('padova_grid_layout') === 'single' ? 'single' : 'double';
  });

  const setGridLayout = (mode: 'double' | 'single') => {
    setGridLayoutState(mode);
    safeStorageSet('padova_grid_layout', mode);
  };

  const [isMapSectionOpen, setIsMapSectionOpen] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const [videoModalListing, setVideoModalListing] = useState<HousingListing | null>(null);
  const [previewModalListing, setPreviewModalListing] = useState<HousingListing | null>(null);
  const [editingListing, setEditingListing] = useState<HousingListing | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [authModalReason, setAuthModalReason] = useState<'chat' | 'createListing' | 'default' | null>(null);
  const [pendingCreateListingAfterAuth, setPendingCreateListingAfterAuth] = useState(false);

  // Eski sürümden kalan yerel verileri bir kez temizle
  useEffect(() => {
    LEGACY_STORAGE_KEYS.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch {}
    });
  }, []);

  useEffect(() => {
    safeStorageSet('padova_housing_lang', currentLang);
    // Tarayıcı ve büyük harf dönüşümü (uppercase) doğru dil kurallarını kullansın: İ/I ayrımı, ekran okuyucu sesi.
    document.documentElement.lang = currentLang;
  }, [currentLang]);

  useEffect(() => {
    safeStorageSet(LISTINGS_CACHE_KEY, JSON.stringify(allListings));
  }, [allListings]);

  useEffect(() => {
    safeStorageSet(FAVORITES_KEY, JSON.stringify(favoriteIds));
  }, [favoriteIds]);

  // Supabase Auth listener. onAuthStateChange; giriş/çıkışta ve oturum yenilendiğinde
  // (örn. e-posta doğrulandıktan sonra USER_UPDATED ile) tetiklenir.
  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setAuthReady(true);
      const user = session?.user || null;

      if (!user) {
        setAuthUser(null);
        setProfileExtras({});
        setHasAdminGrant(false);
        lastSyncedKey.current = '';
        return;
      }

      const snapshot: AuthSnapshot = {
        uid: user.id,
        email: user.email || '',
        emailVerified: Boolean(user.email_confirmed_at),
        displayName: (user.user_metadata?.display_name as string) || '',
        photoURL: (user.user_metadata?.avatar_url as string) || '',
        unipdVerified: isUniPdVerifiedUser(user),
      };
      setAuthUser(snapshot);

      // Profil yalnızca kullanıcı veya doğrulama durumu değiştiğinde senkronize edilir.
      const syncKey = `${snapshot.uid}:${snapshot.email}:${snapshot.unipdVerified}`;
      if (lastSyncedKey.current === syncKey) return;
      lastSyncedKey.current = syncKey;

      try {
        const remote = await getUserProfile(user.id);
        const extras: Partial<UserProfile> = remote
          ? {
              name: remote.name,
              username: remote.username,
              faculty: remote.faculty,
              bio: remote.bio,
              phone: remote.phone,
              avatar: remote.photoURL || undefined,
            }
          : {};
        setProfileExtras(extras);

        if (remote?.savedListingIds?.length) {
          setFavoriteIds((prev) => Array.from(new Set([...prev, ...remote.savedListingIds!])));
        }

        await syncUserProfile(
          {
            id: snapshot.uid,
            email: snapshot.email,
            name: extras.name || snapshot.displayName,
            username: extras.username || snapshot.email.split('@')[0],
            faculty: extras.faculty,
            bio: extras.bio,
            phone: extras.phone,
            avatar: extras.avatar || snapshot.photoURL,
          },
          snapshot.unipdVerified
        );
      } catch (e) {
        console.warn('Could not sync user profile:', e);
      }
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  // Giriş sonrası bekleyen "ilan ver" isteğini aç
  useEffect(() => {
    if (isLoggedIn && pendingCreateListingAfterAuth) {
      setPendingCreateListingAfterAuth(false);
      setIsCreateModalOpen(true);
    }
  }, [isLoggedIn, pendingCreateListingAfterAuth]);

  // Admin yetkisi (admins/{uid} belgesinin varlığı)
  useEffect(() => {
    if (!authUser) return;
    return subscribeToAdminStatus(authUser.uid, setHasAdminGrant);
  }, [authUser?.uid]);

  // Ana admin: tüm admin yetkilerini listele
  useEffect(() => {
    if (!isSuperAdmin) {
      setAdminGrantUids([]);
      return;
    }
    return subscribeToAdminGrants((grants) => setAdminGrantUids(grants.map((g) => g.uid)));
  }, [isSuperAdmin]);

  // Firestore Real-Time Listings Synchronization
  useEffect(() => {
    return subscribeToListings(
      (firestoreListings) => setAllListings(firestoreListings.map((l, idx) => withCoords(l, idx))),
      () => showToast(t.toastListingsLoadFail)
    );
  }, [showToast]);

  // Mesajlar ve bildirimler (yalnızca giriş yapmış kullanıcı)
  useEffect(() => {
    if (!authUser) {
      setMessages([]);
      setDraftContacts([]);
      return;
    }
    return subscribeToMessages(authUser.uid, setMessages, () => showToast(t.toastMessagesLoadFail));
  }, [authUser?.uid, showToast]);

  useEffect(() => {
    if (!authUser) {
      setNotifications([]);
      return;
    }
    return subscribeToNotifications(authUser.uid, setNotifications);
  }, [authUser?.uid]);

  // Mesajlaşılan kişilerin herkese açık profillerini yükle
  useEffect(() => {
    if (!authUser) return;
    const missing = new Set<string>();
    messages.forEach((m) => {
      const other = m.senderId === authUser.uid ? m.recipientId : m.senderId;
      if (!(other in contactProfiles)) missing.add(other);
    });
    if (missing.size === 0) return;
    missing.forEach((uid) => {
      setContactProfiles((prev) => ({ ...prev, [uid]: prev[uid] ?? null }));
      getPublicUserProfile(uid).then((profile) => {
        setContactProfiles((prev) => ({ ...prev, [uid]: profile }));
      });
    });
  }, [messages, authUser?.uid]);

  // Handlers
  const handleOpenAuthModal = (
    mode: 'login' | 'register' | 'forgot' = 'login',
    reason: 'chat' | 'createListing' | 'default' | null = null
  ) => {
    setAuthModalMode(mode);
    setAuthModalReason(reason);
    setIsAuthModalOpen(true);
  };

  // İlan vermek için üye girişi gerekir; misafir giriş/kayıt penceresine yönlendirilir.
  const handleOpenCreateListingModal = () => {
    if (!isLoggedIn) {
      handleOpenAuthModal('login', 'createListing');
      return;
    }
    setEditingListing(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenEditListingModal = (listing: HousingListing) => {
    if (!isLoggedIn) {
      handleOpenAuthModal('login', 'createListing');
      return;
    }
    setEditingListing(listing);
    setIsCreateModalOpen(true);
  };

  // Oturum durumu Firebase listener'ından gelir; burada yalnızca modal sonrası akış yönetilir.
  // İlan vermek için açılan giriş penceresi başarıyla bittiyse, oturum oturunca sihirbaza devam edilir.
  const resumeCreateAfterLogin = useRef(false);
  const handleLoginSuccess = (_userData?: Partial<UserProfile>) => {
    if (authModalReason === 'createListing') resumeCreateAfterLogin.current = true;
    setIsAuthModalOpen(false);
  };
  useEffect(() => {
    if (isLoggedIn && resumeCreateAfterLogin.current) {
      resumeCreateAfterLogin.current = false;
      setEditingListing(null);
      setIsCreateModalOpen(true);
    }
  }, [isLoggedIn]);

  const handleLogout = () => {
    setIsChatOpen(false);
    setActiveConversationId('');
    logOut().catch((err) => showToast(describeAuthError(err, currentLang)));
  };

  const handleUpdateProfile = (updated: Partial<UserProfile>) => {
    if (!authUser) return;
    // Kimlik, rol ve doğrulama alanları buradan değiştirilemez; Firebase Auth ve kurallar belirler.
    const {
      id: _id, email: _email, role: _role, userHash: _hash,
      studentIdVerified: _siv, ssoVerified: _sso, ssoProvider: _sp,
      ...editable
    } = updated;
    if (editable.avatar && (editable.avatar.startsWith('data:') || editable.avatar.length > 2048)) {
      console.warn('Blocked raw Base64 avatar from handleUpdateProfile');
      delete editable.avatar;
    }
    const nextExtras = { ...profileExtras, ...editable };
    setProfileExtras(nextExtras);
    syncUserProfile(
      { ...currentUser, ...nextExtras, id: authUser.uid, email: authUser.email },
      authUser.unipdVerified
    ).catch((err) => {
      console.warn('Could not sync updated profile to Firestore:', err);
      showToast(t.toastProfileSaveFail);
    });
  };

  const handleRequestUniPdVerification = async (unipdEmail: string) => {
    await requestUniPdEmailVerification(unipdEmail);
  };

  const handleResendVerificationEmail = async () => {
    await resendVerificationEmail();
  };

  // Kullanıcı e-postasındaki linke tıkladıktan sonra çağrılır. Token yenilenince
  // onIdTokenChanged tetiklenir ve rozet + Firestore profili güncellenir.
  const handleRefreshVerification = async () => {
    const user = await reloadCurrentUser();
    return isUniPdVerifiedUser(user);
  };

  const handleGrantAdminHash = async (uid: string, note?: string) => {
    const trimmed = uid.trim();
    if (!isSuperAdmin || !authUser || !trimmed || adminGrantUids.includes(trimmed)) return;
    await grantAdmin(trimmed, authUser.uid, note);
  };

  const handleRevokeAdminHash = async (uid: string) => {
    if (!isSuperAdmin) return;
    await revokeAdmin(uid);
  };

  const handleToggleFavorite = (e?: React.MouseEvent, listingId?: string) => {
    if (e) e.stopPropagation();
    if (!listingId) return;
    setFavoriteIds((prev) => {
      const next = prev.includes(listingId) ? prev.filter((id) => id !== listingId) : [...prev, listingId];
      if (authUser) {
        updateUserFavorites(authUser.uid, next).catch((err) => console.warn('Favorite sync error:', err));
      }
      return next;
    });
  };

  // ---- Mesajlaşma ----

  const conversations: ConversationContact[] = useMemo(() => {
    if (!authUser) return [];
    const me = authUser.uid;
    const groups = new Map<string, FirestoreMessage[]>();
    messages.forEach((m) => {
      const other = m.senderId === me ? m.recipientId : m.senderId;
      if (!groups.has(other)) groups.set(other, []);
      groups.get(other)!.push(m);
    });

    const fromMessages: ConversationContact[] = Array.from(groups.entries()).map(([otherUid, msgs]) => {
      const profile = contactProfiles[otherUid];
      const draft = draftContacts.find((d) => d.id === otherUid);
      const withSubject = [...msgs].reverse().find((m) => m.subject);
      const last = msgs[msgs.length - 1];
      const directMessages: DirectMessage[] = msgs.map((m) => ({
        id: m.id,
        sender: m.senderId === me ? 'user' : 'target',
        text: m.text,
        time: formatDeviceTime(m.createdAt),
        timestamp: m.createdAt,
      }));
      return {
        id: otherUid,
        username: profile?.username || draft?.username || 'kullanici',
        name: profile?.name || draft?.name || t.defaultStudentName,
        avatar: profile?.photoURL || draft?.avatar || DEFAULT_GUEST_USER.avatar,
        department: profile?.faculty || draft?.department || 'UniPD',
        subject: withSubject?.subject || draft?.subject || '',
        listingId: withSubject?.listingId || draft?.listingId,
        unreadCount: msgs.filter((m) => m.recipientId === me && !m.read).length,
        online: false,
        lastMessageTime: formatDeviceTime(last.createdAt),
        messages: directMessages,
      };
    });

    fromMessages.sort((a, b) => {
      const aLast = a.messages[a.messages.length - 1]?.timestamp || 0;
      const bLast = b.messages[b.messages.length - 1]?.timestamp || 0;
      return bLast - aLast;
    });

    const drafts = draftContacts.filter((d) => !groups.has(d.id));
    return [...drafts, ...fromMessages];
  }, [authUser, messages, contactProfiles, draftContacts]);

  const handleOpenChat = (username: string, subject: string, listingId?: string) => {
    if (!isLoggedIn || !authUser) {
      handleOpenAuthModal('login', 'chat');
      return;
    }

    const listing =
      (listingId && allListings.find((l) => l.id === listingId)) ||
      allListings.find((l) => l.poster?.username === username);
    const recipientUid = listing?.userId || listing?.poster?.id;

    if (!recipientUid) {
      showToast(t.toastCannotMessageOwner);
      return;
    }
    if (recipientUid === authUser.uid) {
      showToast(t.toastCannotMessageSelf, 'info');
      return;
    }

    const exists = conversations.some((c) => c.id === recipientUid);
    if (!exists) {
      const draft: ConversationContact = {
        id: recipientUid,
        username: listing?.poster.username || username,
        name: listing?.poster.name || username,
        avatar: listing?.poster.avatar || DEFAULT_GUEST_USER.avatar,
        department: listing?.poster.department || 'UniPD',
        subject: subject || listing?.title || t.defaultChatSubject,
        listingId: listing?.id,
        unreadCount: 0,
        online: false,
        lastMessageTime: '',
        messages: [
          {
            id: `sys-${recipientUid}`,
            sender: 'system',
            text: t.chatStartedNotice.replace('{subject}', subject || listing?.title || ''),
            time: formatDeviceTime(),
          },
        ],
      };
      setDraftContacts((prev) => [draft, ...prev.filter((d) => d.id !== recipientUid)]);
    }
    setActiveConversationId(recipientUid);
    setIsChatOpen(true);
  };

  const handleSendMessage = (conversationIdOrText: string, maybeText?: string) => {
    if (!authUser) {
      handleOpenAuthModal('login', 'chat');
      return;
    }

    let targetConvId = activeConversationId;
    let messageText = '';
    if (typeof maybeText === 'string') {
      targetConvId = conversationIdOrText || activeConversationId;
      messageText = maybeText.trim();
    } else {
      messageText = (conversationIdOrText || '').trim();
    }
    if (!messageText) return;

    const contact = conversations.find((c) => c.id === targetConvId);
    if (!contact) {
      showToast(t.toastPickChat, 'info');
      return;
    }
    if (!authUser.emailVerified) {
      showToast(t.toastVerifyEmailToMessage);
      return;
    }

    setActiveConversationId(contact.id);
    sendMessageToFirestore({
      senderId: authUser.uid,
      recipientId: contact.id,
      text: messageText,
      listingId: contact.listingId,
      subject: contact.subject,
    }).catch((err) => {
      console.warn('Message send error:', err);
      showToast(t.toastMessageSendFail);
    });
  };

  // Açık sohbetteki okunmamış mesajları okundu işaretle
  useEffect(() => {
    if (!authUser || !activeConversationId) return;
    const viewing = isChatOpen || window.location.pathname.startsWith('/mesajlar');
    if (!viewing) return;
    const unreadIds = messages
      .filter((m) => m.senderId === activeConversationId && m.recipientId === authUser.uid && !m.read)
      .map((m) => m.id);
    if (unreadIds.length > 0) {
      markMessagesRead(unreadIds).catch((err) => console.warn('Mark read error:', err));
    }
  }, [messages, activeConversationId, isChatOpen, authUser?.uid]);

  // ---- İlanlar ----

  const requireVerifiedUser = () => {
    if (!authUser) throw new Error(t.errListingNeedLogin);
    if (!authUser.emailVerified) {
      throw new Error(t.errListingNeedEmail);
    }
    return authUser;
  };

  const handleAddListing = async (newListing: HousingListing) => {
    const user = requireVerifiedUser();
    const listing: HousingListing = withCoords({
      ...newListing,
      ...evaluateFairPrice(newListing.price, newListing.district, newListing.roomType),
      userId: user.uid,
      isStudentCardVerified: user.unipdVerified,
      poster: { ...newListing.poster, id: user.uid, verifiedUniPD: user.unipdVerified },
    });
    await saveListingToFirestore(listing, user.uid);
    setIsMapSectionOpen(true);
  };

  const handleUpdateListing = async (listingId: string, updates: Partial<HousingListing>) => {
    requireVerifiedUser();
    const current = allListings.find((l) => l.id === listingId);
    const merged = { ...current, ...updates } as HousingListing;
    const next: Partial<HousingListing> = { ...updates };
    if (updates.price !== undefined || updates.district || updates.roomType) {
      Object.assign(next, evaluateFairPrice(merged.price, merged.district, merged.roomType));
    }
    if ((updates.streetAddress || updates.district) && !(updates.lat && updates.lng)) {
      const [lat, lng] = resolveListingCoords(merged);
      next.lat = lat;
      next.lng = lng;
    }
    await updateListingInFirestore(listingId, next);
  };

  // İlan sahibine admin işlemleri hakkında bildirim gönderir (kurallar adminlere izin verir).
  const notifyListingOwner = (listing: HousingListing, title: string, message: string) => {
    if (!listing.userId || listing.userId === authUser?.uid) return;
    saveNotificationToFirestore({
      userId: listing.userId,
      title,
      message,
      type: 'admin',
      createdAt: new Date().toISOString(),
      linkView: 'myListings',
      linkId: listing.id,
    }).catch((err) => console.warn('Owner notification error:', err));
  };

  const handleDeleteListing = (id: string) => {
    const target = allListings.find((l) => l.id === id);
    if (!target) return;
    deleteListingFromFirestore(target)
      .then(() => {
        if (isAdmin) {
          notifyListingOwner(target, 'İlanınız kaldırıldı', `"${target.title}" ilanınız yönetici tarafından kaldırıldı.`);
        }
      })
      .catch((err) => {
        console.warn('Firestore listing deletion error:', err);
        showToast(t.toastDeleteFail);
      });
  };

  const adminUpdateListing = (
    id: string,
    buildUpdates: (l: HousingListing) => Partial<HousingListing>,
    ownerMessage?: (l: HousingListing, updates: Partial<HousingListing>) => [string, string]
  ) => {
    const target = allListings.find((l) => l.id === id);
    if (!target) return;
    if (!isAdmin) {
      showToast(t.toastAdminRequired);
      return;
    }
    const updates = buildUpdates(target);
    updateListingInFirestore(id, updates)
      .then(() => {
        if (ownerMessage) {
          const [title, message] = ownerMessage(target, updates);
          notifyListingOwner(target, title, message);
        }
      })
      .catch((err) => {
        console.warn('Admin listing update error:', err);
        showToast(t.toastUpdateFail);
      });
  };

  const handleToggleVerifyListing = (id: string) =>
    adminUpdateListing(
      id,
      (l) => ({ isStudentCardVerified: !l.isStudentCardVerified }),
      (l, u) => [
        u.isStudentCardVerified ? 'İlanınız doğrulandı' : 'İlan doğrulaması kaldırıldı',
        `"${l.title}" ilanınızın doğrulama durumu yönetici tarafından güncellendi.`,
      ]
    );

  const handleToggleVideoVerified = (id: string) =>
    adminUpdateListing(id, (l) => ({ hasVideoTour: !l.hasVideoTour }));

  const handleUpdateListingPrice = (id: string, newPrice: number) =>
    adminUpdateListing(
      id,
      (l) => ({ price: newPrice, ...evaluateFairPrice(newPrice, l.district, l.roomType) }),
      (l) => ['İlan fiyatı güncellendi', `"${l.title}" ilanınızın fiyatı yönetici tarafından €${newPrice} olarak güncellendi.`]
    );

  const handleMarkListingAsRented = (
    listingId: string,
    details?: { rentedPrice: number; tenantType: string; note?: string }
  ) => {
    const target = allListings.find((l) => l.id === listingId);
    if (!target || !authUser) return;

    const rentedDateStr = new Date().toLocaleDateString(LANG_LOCALE[currentLang], {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    updateListingInFirestore(listingId, {
      isArchived: true,
      rentedAt: rentedDateStr,
      rentedPrice: details?.rentedPrice || target.price,
      archiveReason: details?.note || 'Kiracı bulundu',
      tenantType: details?.tenantType || 'UniPD Öğrencisi',
      confirmationTimeLeft: TRANSLATIONS.tr.confirmedArchived,
    })
      .then(() =>
        saveNotificationToFirestore({
          userId: authUser.uid,
          title: t.notifTenantTitle,
          message: t.notifTenantMsg.replace('{title}', target.title).replace('{price}', String(details?.rentedPrice || target.price)),
          type: 'tenant',
          createdAt: new Date().toISOString(),
          linkView: 'myListings',
        })
      )
      .catch((err) => {
        console.warn('Mark rented error:', err);
        showToast(t.toastArchiveFail);
      });
  };

  const handleReactivateListing = (listingId: string) => {
    const target = allListings.find((l) => l.id === listingId);
    if (!target || !authUser) return;

    updateListingInFirestore(
      listingId,
      { isArchived: false, confirmationTimeLeft: TRANSLATIONS.tr.confirmed48h },
      ['rentedAt', 'rentedPrice', 'archiveReason', 'tenantType']
    )
      .then(() =>
        saveNotificationToFirestore({
          userId: authUser.uid,
          title: t.notifReactivateTitle,
          message: t.notifReactivateMsg.replace('{title}', target.title),
          type: 'listing',
          createdAt: new Date().toISOString(),
          linkView: 'myListings',
        })
      )
      .catch((err) => {
        console.warn('Reactivate error:', err);
        showToast(t.toastReactivateFail);
      });
  };

  const handleMarkAllNotificationsRead = () => {
    const ids = notifications.filter((n) => !n.read).map((n) => n.id);
    markNotificationsRead(ids).catch((err) => console.warn('Notifications read error:', err));
  };

  const handleDeleteNotification = (id: string) => {
    deleteNotificationFromFirestore(id).catch((err) => {
      console.warn('Notification delete error:', err);
      showToast(t.toastNotifDeleteFail);
    });
  };

  // ---- Türetilmiş listeler ----

  const listings = useMemo(() => allListings.filter((l) => !l.isArchived), [allListings]);

  const isMine = useCallback(
    (l: HousingListing) => Boolean(authUser && (l.userId === authUser.uid || l.poster?.id === authUser.uid)),
    [authUser]
  );

  // Adminler tüm arşivi görür, diğer kullanıcılar yalnızca kendi arşivlerini.
  const archivedListings = useMemo(
    () => allListings.filter((l) => l.isArchived && (isAdmin || isMine(l))),
    [allListings, isAdmin, isMine]
  );

  const filteredListings = useMemo(() => {
    const result = listings.filter((l) => {
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matches =
          l.title.toLowerCase().includes(query) ||
          l.district.toLowerCase().includes(query) ||
          (l.streetAddress || '').toLowerCase().includes(query);
        if (!matches) return false;
      }
      switch (filters.categoryTab) {
        case 'video':
          if (!l.hasVideoTour) return false;
          break;
        case 'transitorio':
          if (!l.contractType?.includes('Transitorio')) return false;
          break;
        case 'subentro':
          if (!l.contractType?.includes('Subentro')) return false;
          break;
        case 'roommates':
          if (!((l.currentFlatmates?.length || 0) > 0 || (l.totalHousemates || 0) > 1)) return false;
          break;
      }
      if (filters.district !== 'all' && l.district !== filters.district) return false;
      if (filters.contractType !== 'all' && l.contractType !== filters.contractType) return false;
      if (filters.roomType !== 'all' && l.roomType !== filters.roomType) return false;
      if (l.price > filters.maxPrice) return false;
      if (filters.onlyVideoTour && !l.hasVideoTour) return false;
      if (filters.onlyStudentVerified && !l.isStudentCardVerified) return false;
      if (filters.onlyHighCompatibility && (l.compatibilityScore || 0) < 85) return false;

      const start = filters.contractStartDateFilter;
      if (start && start !== 'all') {
        if (start === 'immediate') {
          if (l.contractStartISO) return false;
        } else {
          const month = l.contractStartISO ? Number(l.contractStartISO.split('-')[1]) : NaN;
          if (!START_FILTER_MONTHS[start]?.includes(month)) return false;
        }
      }
      if (filters.genderPreferenceFilter && filters.genderPreferenceFilter !== 'all' && l.genderPreference !== filters.genderPreferenceFilter) return false;
      if (filters.heatingTypeFilter && filters.heatingTypeFilter !== 'all' && l.heatingType !== filters.heatingTypeFilter) return false;
      if (filters.occupantTypeFilter && filters.occupantTypeFilter !== 'all' && l.occupantType !== filters.occupantTypeFilter) return false;
      if (filters.smokingFilter === 'allowed' && !l.smokingAllowed) return false;
      if (filters.smokingFilter === 'forbidden' && l.smokingAllowed) return false;
      if (filters.petsFilter === 'allowed' && !l.petsAllowed) return false;
      if (filters.petsFilter === 'forbidden' && l.petsAllowed) return false;
      if (filters.onlyAirConditioning && !l.hasAirConditioning) return false;
      if (filters.onlyWashingMachine && !l.hasWashingMachine) return false;
      if (filters.onlyWifi && !l.hasWifi) return false;
      if (filters.onlyBikeParking && !l.hasBikeParking) return false;
      if (filters.onlyParking && !l.hasParking) return false;
      return true;
    });

    const sortBy = filters.categoryTab === 'newest' ? 'newest' : filters.sortBy;
    switch (sortBy) {
      case 'price-asc':
        return result.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return result.sort((a, b) => b.price - a.price);
      case 'compatibility-desc':
        return result.sort((a, b) => (b.compatibilityScore || 0) - (a.compatibilityScore || 0));
      case 'newest':
        return result.sort((a, b) => createdAtMs(b) - createdAtMs(a));
      default:
        return result;
    }
  }, [listings, filters]);

  const myListings = useMemo(() => listings.filter(isMine), [listings, isMine]);

  const unreadMessagesCount = useMemo(() => {
    return conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  }, [conversations]);

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const value: AppContextType = {
    currentLang,
    setCurrentLang,
    t,
    currentUser,
    isLoggedIn,
    authReady,
    emailVerified: Boolean(authUser?.emailVerified),
    isAdmin,
    isSuperAdmin,
    handleLoginSuccess,
    handleLogout,
    handleUpdateProfile,
    handleRequestUniPdVerification,
    handleResendVerificationEmail,
    handleRefreshVerification,
    authorizedAdminHashes: adminGrantUids,
    handleGrantAdminHash,
    handleRevokeAdminHash,
    listings,
    archivedListings,
    favoriteIds,
    filters,
    setFilters,
    filteredListings,
    myListings,
    handleAddListing,
    handleUpdateListing,
    handleDeleteListing,
    handleToggleVerifyListing,
    handleToggleVideoVerified,
    handleUpdateListingPrice,
    handleMarkListingAsRented,
    handleReactivateListing,
    handleToggleFavorite,
    editingListing,
    setEditingListing,
    handleOpenEditListingModal,
    conversations,
    activeConversationId,
    setActiveConversationId,
    handleSendMessage,
    handleOpenChat,
    unreadMessagesCount,
    isChatOpen,
    setIsChatOpen,
    notifications,
    unreadNotificationsCount,
    handleMarkAllNotificationsRead,
    handleDeleteNotification,
    toast,
    showToast,
    dismissToast,
    gridLayout,
    setGridLayout,
    isMapSectionOpen,
    setIsMapSectionOpen,
    isMobileFilterOpen,
    setIsMobileFilterOpen,
    videoModalListing,
    setVideoModalListing,
    previewModalListing,
    setPreviewModalListing,
    isCreateModalOpen,
    setIsCreateModalOpen,
    handleOpenCreateListingModal,
    isProfileSettingsOpen,
    setIsProfileSettingsOpen,
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    handleOpenAuthModal,
    authModalReason,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
