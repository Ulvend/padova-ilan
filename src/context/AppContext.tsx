import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { 
  FilterState, 
  HousingListing, 
  Language, 
  ConversationContact, 
  DirectMessage, 
  UserProfile, 
  UserNotification 
} from '../types';
import { 
  INITIAL_HOUSING_LISTINGS, 
  INITIAL_CONVERSATIONS, 
  DEFAULT_GUEST_USER,
  resolveListingCoords,
  INITIAL_ARCHIVED_LISTINGS,
  INITIAL_AUTHORIZED_ADMIN_HASHES,
  INITIAL_NOTIFICATIONS
} from '../data/mockData';
import { TRANSLATIONS } from '../utils/translations';
import { formatDeviceTime, initializeConversationsWithDeviceTime } from '../utils/deviceTime';
import { auth, logOut } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  getUserProfile, 
  syncUserProfile, 
  updateUserFavorites, 
  saveListingToFirestore, 
  subscribeToListings 
} from '../services/firebaseService';

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

const MOCK_LISTING_IDS = new Set([
  'PD-FORC-101',
  'PD-PORT-102',
  'PD-BEAT-103',
  'PD-PRATO-104',
  'PD-ARC-105',
  'PD-GUIZ-106',
  'PD-PAST-001',
]);

interface AppContextType {
  // Language & Translations
  currentLang: Language;
  setCurrentLang: (lang: Language) => void;
  t: typeof TRANSLATIONS['tr'];

  // Auth & Profile
  currentUser: UserProfile;
  isLoggedIn: boolean;
  isSuperAdmin: boolean;
  handleLoginSuccess: (userData?: Partial<UserProfile>) => void;
  handleLogout: () => void;
  handleUpdateProfile: (updated: Partial<UserProfile>) => void;
  authorizedAdminHashes: string[];
  handleGrantAdminHash: (hash: string, note?: string) => void;
  handleRevokeAdminHash: (hash: string) => void;

  // Listings & Favorites
  listings: HousingListing[];
  archivedListings: HousingListing[];
  favoriteIds: string[];
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  filteredListings: HousingListing[];
  myListings: HousingListing[];
  handleAddListing: (newListing: HousingListing) => void;
  handleDeleteListing: (id: string) => void;
  handleToggleVerifyListing: (id: string) => void;
  handleToggleVideoVerified: (id: string) => void;
  handleUpdateListingPrice: (id: string, newPrice: number) => void;
  handleMarkListingAsRented: (listingId: string, details?: { rentedPrice: number; tenantType: string; note?: string }) => void;
  handleReactivateListing: (listingId: string) => void;
  handleToggleFavorite: (e?: React.MouseEvent, listingId?: string) => void;

  // Conversations & Chat
  conversations: ConversationContact[];
  activeConversationId: string;
  setActiveConversationId: (id: string) => void;
  handleSendMessage: (conversationIdOrText: string, maybeText?: string) => void;
  handleOpenChat: (username: string, subject: string) => void;
  unreadMessagesCount: number;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;

  // Notifications
  notifications: UserNotification[];
  unreadNotificationsCount: number;
  handleMarkAllNotificationsRead: () => void;
  handleDeleteNotification: (id: string) => void;

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

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Language State
  const [currentLang, setCurrentLang] = useState<Language>(() => {
    const saved = localStorage.getItem('padova_housing_lang');
    if (saved && ['tr', 'en', 'it', 'de', 'ru', 'hi'].includes(saved)) {
      return saved as Language;
    }
    return 'tr';
  });

  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.tr;

  // 2. Auth & User Profile State
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('padova_current_user_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Sanitize legacy base64 avatars that might bloat localStorage
        if (parsed.avatar && (parsed.avatar.startsWith('data:') || parsed.avatar.length > 2048)) {
          parsed.avatar = DEFAULT_GUEST_USER.avatar;
          localStorage.setItem('padova_current_user_v2', JSON.stringify(parsed));
        }
        return parsed;
      } catch (e) {
        console.error('Failed to parse saved user', e);
      }
    }
    return DEFAULT_GUEST_USER;
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const saved = localStorage.getItem('padova_is_logged_in_v2');
    return saved === 'true';
  });

  const isSuperAdmin = currentUser.role === 'superadmin' || currentUser.email === 'cnkborasimsek@gmail.com';

  // 3. Listings State
  const [listings, setListings] = useState<HousingListing[]>(() => {
    const saved = localStorage.getItem('padova_housing_listings');
    if (saved) {
      try {
        const parsed: HousingListing[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const userOnly = parsed.filter((item) => !MOCK_LISTING_IDS.has(item.id));
          return userOnly.map((item, idx) => {
            const [lat, lng] = resolveListingCoords(item, idx);
            return { ...item, lat, lng };
          });
        }
      } catch (e) {
        console.error('Failed to parse saved listings', e);
      }
    }
    return INITIAL_HOUSING_LISTINGS.map((item, idx) => {
      const [lat, lng] = resolveListingCoords(item, idx);
      return { ...item, lat, lng };
    });
  });

  // 4. Conversations State
  const [conversations, setConversations] = useState<ConversationContact[]>(() => {
    const saved = localStorage.getItem('padova_housing_conversations_v5');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((c: ConversationContact) => ({
            ...c,
            messages: (c.messages || []).filter((m) => m && typeof m.text === 'string' && m.text.trim().length > 0),
          }));
        }
      } catch (e) {
        console.error('Failed to parse saved conversations', e);
      }
    }
    return initializeConversationsWithDeviceTime(INITIAL_CONVERSATIONS);
  });

  const [activeConversationId, setActiveConversationId] = useState<string>('conv-giulia');

  // 5. Favorites State
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('padova_housing_favorites_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  // 6. Filter State
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  // 7. Archived Listings
  const [archivedListings, setArchivedListings] = useState<HousingListing[]>(() => {
    const saved = localStorage.getItem('padova_housing_archived_listings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((item: HousingListing) => !MOCK_LISTING_IDS.has(item.id));
        }
      } catch (e) {
        console.error('Failed to parse archived listings', e);
      }
    }
    return INITIAL_ARCHIVED_LISTINGS;
  });

  // 8. Authorized Admin Hashes
  const [authorizedAdminHashes, setAuthorizedAdminHashes] = useState<string[]>(() => {
    const saved = localStorage.getItem('padova_authorized_admin_hashes');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse authorized admin hashes', e);
      }
    }
    return INITIAL_AUTHORIZED_ADMIN_HASHES;
  });

  // 9. User Notifications
  const [notifications, setNotifications] = useState<UserNotification[]>(() => {
    const saved = localStorage.getItem('padova_user_notifications_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse user notifications', e);
      }
    }
    return INITIAL_NOTIFICATIONS;
  });

  // 10. UI & Modal States
  const [gridLayout, setGridLayoutState] = useState<'double' | 'single'>(() => {
    const saved = localStorage.getItem('padova_grid_layout');
    return saved === 'single' ? 'single' : 'double';
  });

  const setGridLayout = (mode: 'double' | 'single') => {
    setGridLayoutState(mode);
    try {
      localStorage.setItem('padova_grid_layout', mode);
    } catch (e) {}
  };

  const [isMapSectionOpen, setIsMapSectionOpen] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const [videoModalListing, setVideoModalListing] = useState<HousingListing | null>(null);
  const [previewModalListing, setPreviewModalListing] = useState<HousingListing | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [authModalReason, setAuthModalReason] = useState<'chat' | 'createListing' | 'default' | null>(null);
  const [pendingCreateListingAfterAuth, setPendingCreateListingAfterAuth] = useState(false);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('padova_housing_lang', currentLang);
  }, [currentLang]);

  useEffect(() => {
    localStorage.setItem('padova_housing_listings', JSON.stringify(listings));
  }, [listings]);

  useEffect(() => {
    localStorage.setItem('padova_housing_conversations_v5', JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    localStorage.setItem('padova_housing_favorites_v2', JSON.stringify(favoriteIds));
  }, [favoriteIds]);

  useEffect(() => {
    localStorage.setItem('padova_housing_archived_listings', JSON.stringify(archivedListings));
  }, [archivedListings]);

  useEffect(() => {
    localStorage.setItem('padova_authorized_admin_hashes', JSON.stringify(authorizedAdminHashes));
  }, [authorizedAdminHashes]);

  useEffect(() => {
    localStorage.setItem('padova_user_notifications_v2', JSON.stringify(notifications));
  }, [notifications]);

  // Firebase Auth State Listener & Profile Sync
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setIsLoggedIn(true);
        try {
          localStorage.setItem('padova_is_logged_in_v2', 'true');
        } catch (e) {}

        const isSuper = firebaseUser.email === 'cnkborasimsek@gmail.com';
        const profileUpdate: Partial<UserProfile> = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Padova Öğrencisi',
          email: firebaseUser.email || '',
          username: firebaseUser.email ? firebaseUser.email.split('@')[0] : 'student',
          avatar: firebaseUser.photoURL || currentUser.avatar,
          studentIdVerified: firebaseUser.email?.endsWith('@studenti.unipd.it') || firebaseUser.email?.endsWith('@unipd.it') || isSuper,
          ssoVerified: true,
          role: isSuper ? 'superadmin' : currentUser.role,
        };

        setCurrentUser((prev) => ({ ...prev, ...profileUpdate }));

        if (pendingCreateListingAfterAuth) {
          setPendingCreateListingAfterAuth(false);
          setIsCreateModalOpen(true);
        }

        try {
          const remoteProfile = await getUserProfile(firebaseUser.uid);
          if (remoteProfile?.savedListingIds && remoteProfile.savedListingIds.length > 0) {
            setFavoriteIds((prev) => Array.from(new Set([...prev, ...remoteProfile.savedListingIds!])));
          }
        } catch (e) {
          console.warn('Could not fetch remote profile:', e);
        }
      }
    });
    return () => unsubscribe();
  }, [pendingCreateListingAfterAuth]);

  // Firestore Real-Time Listings Synchronization
  useEffect(() => {
    const unsubListings = subscribeToListings((firestoreListings) => {
      if (firestoreListings && firestoreListings.length > 0) {
        setListings((prev) => {
          const cleanFirestore = firestoreListings.filter((l) => !MOCK_LISTING_IDS.has(l.id));
          const firestoreIds = new Set(cleanFirestore.map((l) => l.id));
          const existingNonFirestore = prev.filter((l) => !firestoreIds.has(l.id) && !MOCK_LISTING_IDS.has(l.id));
          return [...cleanFirestore, ...existingNonFirestore];
        });
      }
    });
    return () => unsubListings();
  }, []);

  // Handlers
  const handleOpenAuthModal = (
    mode: 'login' | 'register' | 'forgot' = 'login', 
    reason: 'chat' | 'createListing' | 'default' | null = null
  ) => {
    setAuthModalMode(mode);
    setAuthModalReason(reason);
    setIsAuthModalOpen(true);
  };

  const handleOpenCreateListingModal = () => {
    if (!isLoggedIn) {
      setPendingCreateListingAfterAuth(true);
      handleOpenAuthModal('register', 'createListing');
      return;
    }
    setIsCreateModalOpen(true);
  };

  const handleLoginSuccess = (userData?: Partial<UserProfile>) => {
    if (userData) {
      setCurrentUser((prev) => {
        const next = { ...prev, ...userData };
        try {
          localStorage.setItem('padova_current_user_v2', JSON.stringify(next));
        } catch (e) {}
        return next;
      });
    }
    setIsLoggedIn(true);
    try {
      localStorage.setItem('padova_is_logged_in_v2', 'true');
    } catch (e) {}

    if (pendingCreateListingAfterAuth) {
      setPendingCreateListingAfterAuth(false);
      setIsCreateModalOpen(true);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsChatOpen(false);
    setCurrentUser(DEFAULT_GUEST_USER);
    logOut().catch(console.error);
    try {
      localStorage.setItem('padova_is_logged_in_v2', 'false');
      localStorage.removeItem('padova_current_user_v2');
    } catch (e) {}
  };

  const handleUpdateProfile = (updated: Partial<UserProfile>) => {
    setCurrentUser((prev) => {
      const sanitized = { ...updated };
      if (sanitized.avatar && (sanitized.avatar.startsWith('data:') || sanitized.avatar.length > 2048)) {
        console.warn('Blocked raw Base64 avatar from handleUpdateProfile');
        sanitized.avatar = prev.avatar;
      }
      const next = { ...prev, ...sanitized };
      try {
        localStorage.setItem('padova_current_user_v2', JSON.stringify(next));
      } catch (e) {}
      if (next.id || auth.currentUser?.uid) {
        syncUserProfile({ ...next, id: next.id || auth.currentUser!.uid }).catch((err) => {
          console.warn('Could not sync updated profile to Firestore:', err);
        });
      }
      return next;
    });
  };

  const handleToggleFavorite = (e?: React.MouseEvent, listingId?: string) => {
    if (e) e.stopPropagation();
    if (!listingId) return;
    setFavoriteIds((prev) => {
      const next = prev.includes(listingId) ? prev.filter((id) => id !== listingId) : [...prev, listingId];
      if (currentUser?.id) {
        updateUserFavorites(currentUser.id, next).catch((err) => console.warn('Favorite sync error:', err));
      }
      return next;
    });
  };

  const handleOpenChat = (username: string, subject: string) => {
    if (!isLoggedIn) {
      handleOpenAuthModal('login', 'chat');
      return;
    }

    let existing = conversations.find((c) => c.username === username);
    if (!existing) {
      const matchedListing = listings.find((l) => l.poster.username === username);
      const newConv: ConversationContact = {
        id: `conv-${username}-${Date.now()}`,
        username,
        name: matchedListing ? matchedListing.poster.name : username,
        avatar: matchedListing ? matchedListing.poster.avatar : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=80',
        department: matchedListing ? matchedListing.poster.department : 'UniPD Öğrenci',
        subject: subject || (matchedListing ? matchedListing.title : 'Oda Görüşmesi'),
        unreadCount: 0,
        online: true,
        lastMessageTime: 'Şimdi',
        messages: [
          {
            id: `sys-${Date.now()}`,
            sender: 'system',
            text: `Padova Öğrenci Güvenlik Kalkanı: "${subject}" ilanı için güvenli mesajlaşma kanalı açıldı.`,
            time: 'Şimdi',
          },
        ],
      };
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(newConv.id);
    } else {
      setActiveConversationId(existing.id);
    }
    setIsChatOpen(true);
  };

  const handleSendMessage = (conversationIdOrText: string, maybeText?: string) => {
    let targetConvId = activeConversationId;
    let messageText = '';

    if (typeof maybeText === 'string') {
      targetConvId = conversationIdOrText || activeConversationId;
      messageText = maybeText.trim();
    } else {
      messageText = (conversationIdOrText || '').trim();
    }

    if (!messageText) return;

    if (!targetConvId || !conversations.some((c) => c.id === targetConvId)) {
      targetConvId = conversations[0]?.id || 'conv-giulia';
    }

    setActiveConversationId(targetConvId);

    const nowTimestamp = Date.now();
    const timeStr = formatDeviceTime(nowTimestamp);

    const newMessage: DirectMessage = {
      id: `msg-${nowTimestamp}-${Math.random().toString(36).substring(2, 6)}`,
      sender: 'user',
      text: messageText,
      time: timeStr,
      timestamp: nowTimestamp,
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === targetConvId) {
          return {
            ...c,
            lastMessageTime: timeStr,
            messages: [...c.messages, newMessage],
          };
        }
        return c;
      })
    );
  };

  const handleAddListing = (newListing: HousingListing) => {
    const hasValidCoords =
      typeof newListing.lat === 'number' &&
      typeof newListing.lng === 'number' &&
      !isNaN(newListing.lat) &&
      !isNaN(newListing.lng) &&
      newListing.lat > 0 &&
      newListing.lng > 0;
    const [lat, lng] = hasValidCoords ? [newListing.lat, newListing.lng] : resolveListingCoords(newListing);
    const listingWithCoords = { ...newListing, lat, lng };
    setListings((prev) => [listingWithCoords, ...prev]);
    setIsMapSectionOpen(true);
    saveListingToFirestore(listingWithCoords, currentUser.id || auth.currentUser?.uid || 'guest')
      .catch((err) => console.warn('Firestore listing persistence error:', err));
  };

  const handleDeleteListing = (id: string) => {
    setListings((prev) => prev.filter((item) => item.id !== id));
  };

  const handleToggleVerifyListing = (id: string) => {
    setListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, isStudentCardVerified: !l.isStudentCardVerified } : l))
    );
  };

  const handleToggleVideoVerified = (id: string) => {
    setListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, hasVideoTour: !l.hasVideoTour } : l))
    );
  };

  const handleUpdateListingPrice = (id: string, newPrice: number) => {
    setListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, price: newPrice, fairPriceStatus: 'average' } : l))
    );
  };

  const handleMarkListingAsRented = (
    listingId: string, 
    details?: { rentedPrice: number; tenantType: string; note?: string }
  ) => {
    const target = listings.find((l) => l.id === listingId);
    if (!target) return;

    const rentedDateStr = new Date().toLocaleDateString(currentLang === 'it' ? 'it-IT' : 'tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const archivedItem: HousingListing = {
      ...target,
      isArchived: true,
      rentedAt: rentedDateStr,
      rentedPrice: details?.rentedPrice || target.price,
      archiveReason: details?.note || 'Kiracı bulundu',
      tenantType: details?.tenantType || 'UniPD Öğrencisi',
      confirmationTimeLeft: 'Kiracı bulundu (Arşivlendi)',
    };

    setListings((prev) => prev.filter((l) => l.id !== listingId));
    setArchivedListings((prev) => [archivedItem, ...prev]);

    const newNotif: UserNotification = {
      id: `notif-${Date.now()}`,
      userId: currentUser.username,
      title: currentLang === 'it' ? 'Inquilino Trovato & Annuncio Archiviato' : 'Kiracı Bulundu & İlan Arşivlendi',
      message: currentLang === 'it' 
        ? `L'annuncio "${target.title}" è stato contrassegnato come affittato (€${details?.rentedPrice || target.price}/mese) e salvato nell'archivio storico.`
        : `"${target.title}" ilanınız için kiracı bulundu (€${details?.rentedPrice || target.price}/ay) ve 'Geçmiş İlanlar' veri ambarına güvenle aktarıldı.`,
      type: 'tenant',
      read: false,
      createdAt: currentLang === 'it' ? 'Adesso' : 'Şimdi',
      timestamp: Date.now(),
      linkView: 'myListings',
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const handleReactivateListing = (listingId: string) => {
    const target = archivedListings.find((l) => l.id === listingId);
    if (!target) return;

    const reactivatedItem: HousingListing = {
      ...target,
      isArchived: false,
      rentedAt: undefined,
      confirmationTimeLeft: '48 saat içinde teyitli',
    };

    setArchivedListings((prev) => prev.filter((l) => l.id !== listingId));
    setListings((prev) => [reactivatedItem, ...prev]);

    const newNotif: UserNotification = {
      id: `notif-${Date.now()}`,
      userId: currentUser.username,
      title: currentLang === 'it' ? 'Annuncio Riattivato' : 'İlan Tekrar Yayında',
      message: currentLang === 'it' 
        ? `L'annuncio "${target.title}" è stato riattivato e ripubblicato nella bacheca attiva.`
        : `"${target.title}" ilanınız arşivden çıkarılarak tekrar aktif ilanlar arasına alındı.`,
      type: 'listing',
      read: false,
      createdAt: currentLang === 'it' ? 'Adesso' : 'Şimdi',
      timestamp: Date.now(),
      linkView: 'myListings',
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const handleGrantAdminHash = (hash: string, note?: string) => {
    const trimmed = hash.trim();
    if (!trimmed || authorizedAdminHashes.includes(trimmed)) return;
    setAuthorizedAdminHashes((prev) => [...prev, trimmed]);
    if (currentUser.userHash === trimmed) {
      handleUpdateProfile({ role: 'admin' });
    }
  };

  const handleRevokeAdminHash = (hash: string) => {
    setAuthorizedAdminHashes((prev) => prev.filter((h) => h !== hash));
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Filtered listings memo
  const filteredListings = useMemo(() => {
    return listings.filter((l) => {
      // 1. Search Query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesTitle = l.title.toLowerCase().includes(query);
        const matchesDistrict = l.district.toLowerCase().includes(query);
        const matchesAddress = l.streetAddress.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDistrict && !matchesAddress) return false;
      }
      // 2. Category Tab
      if (filters.categoryTab !== 'all') {
        if (filters.categoryTab === 'students' && !l.isStudentCardVerified) return false;
        if (filters.categoryTab === 'video' && !l.hasVideoTour) return false;
        if (filters.categoryTab === 'compat' && l.compatibilityScore < 85) return false;
      }
      // 3. District
      if (filters.district !== 'all' && l.district !== filters.district) return false;
      // 4. Contract Type
      if (filters.contractType !== 'all' && l.contractType !== filters.contractType) return false;
      // 5. Room Type
      if (filters.roomType !== 'all' && l.roomType !== filters.roomType) return false;
      // 6. Max Price
      if (l.price > filters.maxPrice) return false;
      // 7. Video Tour Only
      if (filters.onlyVideoTour && !l.hasVideoTour) return false;
      // 8. Student Verified Only
      if (filters.onlyStudentVerified && !l.isStudentCardVerified) return false;
      // 9. High Compatibility Only
      if (filters.onlyHighCompatibility && l.compatibilityScore < 85) return false;

      return true;
    });
  }, [listings, filters]);

  // My listings memo
  const myListings = useMemo(() => {
    return listings.filter(
      (l) =>
        (currentUser.id && l.userId === currentUser.id) ||
        (currentUser.id && l.poster?.id === currentUser.id) ||
        (currentUser.username && l.poster?.username === currentUser.username) ||
        (l.isMyListing && isLoggedIn)
    );
  }, [listings, currentUser, isLoggedIn]);

  const unreadMessagesCount = useMemo(() => {
    return conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  }, [conversations]);

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const value = {
    currentLang,
    setCurrentLang,
    t,
    currentUser,
    isLoggedIn,
    isSuperAdmin,
    handleLoginSuccess,
    handleLogout,
    handleUpdateProfile,
    authorizedAdminHashes,
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
    handleDeleteListing,
    handleToggleVerifyListing,
    handleToggleVideoVerified,
    handleUpdateListingPrice,
    handleMarkListingAsRented,
    handleReactivateListing,
    handleToggleFavorite,
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
