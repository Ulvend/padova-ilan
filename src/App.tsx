import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { CategorySidebar } from './components/CategorySidebar';
import { ListingCard } from './components/ListingCard';
import { VideoTourModal } from './components/VideoTourModal';
import { ListingDetailModal } from './components/ListingDetailModal';
import { CreateListingModal } from './components/CreateListingModal';
import { ChatWidget } from './components/ChatWidget';
import { MessagesView } from './components/MessagesView';
import { MyListingsView } from './components/MyListingsView';
import { ProfileView } from './components/ProfileView';
import { ListingDetailPage } from './components/ListingDetailPage';
import { NotificationsView } from './components/NotificationsView';
import { PadovaMap } from './components/PadovaMap';
import { MobileBottomNav } from './components/MobileBottomNav';
import { MobileFilterDrawer } from './components/MobileFilterDrawer';
import { RecentlyAddedSection } from './components/RecentlyAddedSection';
import { Map, MapPin, ChevronDown, ChevronUp, Grid2X2, List, Filter, Search, MessageSquare, X, Video, Star, GraduationCap, DoorClosed, CircleDollarSign, Bell, Plus } from 'lucide-react';

import { ActiveView, FilterState, HousingListing, Language, ConversationContact, DirectMessage, UserProfile, UserNotification } from './types';
import { 
  INITIAL_HOUSING_LISTINGS, 
  INITIAL_CONVERSATIONS, 
  DEFAULT_GUEST_USER,
  CURRENT_USER, 
  resolveListingCoords,
  INITIAL_ARCHIVED_LISTINGS,
  INITIAL_AUTHORIZED_ADMIN_HASHES,
  INITIAL_NOTIFICATIONS
} from './data/mockData';
import { TRANSLATIONS } from './utils/translations';
import { formatDeviceTime, syncSavedConversationsWithDeviceTime, initializeConversationsWithDeviceTime } from './utils/deviceTime';
import { ProfileSettingsModal } from './components/ProfileSettingsModal';
import { AuthModal } from './components/AuthModal';
import { AdminPanel } from './components/AdminPanel';
import { auth, logOut } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  getUserProfile, 
  syncUserProfile, 
  updateUserFavorites, 
  saveListingToFirestore, 
  subscribeToListings 
} from './services/firebaseService';

const DEFAULT_FILTERS: FilterState = {
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

export const App: React.FC = () => {
  // Navigation State
  const [currentView, setCurrentView] = useState<ActiveView>('home');
  
  // Language State with persistence
  const [currentLang, setCurrentLang] = useState<Language>(() => {
    const saved = localStorage.getItem('padova_housing_lang');
    if (saved && ['tr', 'en', 'it', 'de', 'ru', 'hi'].includes(saved)) {
      return saved as Language;
    }
    return 'tr';
  });

  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.tr;

  // Listings State with robust coordinates migration for all listings
  const [listings, setListings] = useState<HousingListing[]>(() => {
    const saved = localStorage.getItem('padova_housing_listings');
    if (saved) {
      try {
        const parsed: HousingListing[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Filter out mock listings so user can create and test manually
          const userOnly = parsed.filter((item) => !MOCK_LISTING_IDS.has(item.id));
          return userOnly.map((item, idx) => {
            const [lat, lng] = resolveListingCoords(item, idx);
            return {
              ...item,
              lat,
              lng,
            };
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

  // Multi-person conversations State anchored to user's device clock & locale
  const [conversations, setConversations] = useState<ConversationContact[]>(() => {
    const saved = localStorage.getItem('padova_housing_conversations_v5');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((c: ConversationContact) => ({
            ...c,
            messages: (c.messages || []).filter((m) => m && typeof m.text === 'string' && m.text.trim().length > 0),
          }));
        }
      } catch (e) {
        console.error('Failed to parse saved conversations', e);
      }
    }
    return [];
  });

  const [activeConversationId, setActiveConversationId] = useState<string>('');

  // Favorites State
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

  // Filter State
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  // Past / Archived Listings State (Geçmiş İlanlar & Piyasa Veri Ambarı)
  const [archivedListings, setArchivedListings] = useState<HousingListing[]>(() => {
    const saved = localStorage.getItem('padova_housing_archived_listings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const userOnly = parsed.filter((item: HousingListing) => !MOCK_LISTING_IDS.has(item.id));
          return userOnly;
        }
      } catch (e) {
        console.error('Failed to parse archived listings', e);
      }
    }
    return INITIAL_ARCHIVED_LISTINGS;
  });

  // Authorized Admin Hashes State (Admin Yetkilendirme Masası)
  const [authorizedAdminHashes, setAuthorizedAdminHashes] = useState<string[]>(() => {
    const saved = localStorage.getItem('padova_authorized_admin_hashes');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse authorized admin hashes', e);
      }
    }
    return INITIAL_AUTHORIZED_ADMIN_HASHES;
  });

  // User Notifications State (Kullanıcıya Özel Bildirimler Masası)
  const [notifications, setNotifications] = useState<UserNotification[]>(() => {
    const saved = localStorage.getItem('padova_user_notifications_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse user notifications', e);
      }
    }
    return [];
  });

  // SEPARATE STATES: Dedicated Detail Page Listing vs. Quick Preview Pop-up Listing
  const [detailPageListing, setDetailPageListing] = useState<HousingListing | null>(null);
  const [previewModalListing, setPreviewModalListing] = useState<HousingListing | null>(null);

  // Expandable/Collapsible Padova Map Section State (Above listings, next to filter desk)
  const [isMapSectionOpen, setIsMapSectionOpen] = useState(false);

  const [videoModalListing, setVideoModalListing] = useState<HousingListing | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Home feed grid layout mode: default is 'double' (çift satır / 2'li ızgara)
  const [gridLayout, setGridLayout] = useState<'double' | 'single'>(() => {
    const saved = localStorage.getItem('padova_grid_layout');
    return saved === 'single' ? 'single' : 'double';
  });

  const handleSetGridLayout = (mode: 'double' | 'single') => {
    setGridLayout(mode);
    try {
      localStorage.setItem('padova_grid_layout', mode);
    } catch (e) {
      console.error('Failed to save grid layout', e);
    }
  };

  // User profile state with local persistence (for custom profile photo updates)
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('padova_current_user_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved user', e);
      }
    }
    return DEFAULT_GUEST_USER;
  });

  // Session & Guest State Management: Defaults to false (guest / misafir)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const saved = localStorage.getItem('padova_is_logged_in_v2');
    return saved === 'true';
  });

  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [authModalReason, setAuthModalReason] = useState<'chat' | 'createListing' | 'default' | null>(null);
  const [pendingCreateListingAfterAuth, setPendingCreateListingAfterAuth] = useState(false);

  const handleUpdateProfile = (updated: Partial<UserProfile>) => {
    setCurrentUser((prev) => {
      const next = { ...prev, ...updated };
      try {
        localStorage.setItem('padova_current_user_v2', JSON.stringify(next));
      } catch (e) {
        console.error('Failed to save profile updates', e);
      }
      return next;
    });
  };

  const handleOpenAuthModal = (mode: 'login' | 'register' | 'forgot' = 'login', reason: 'chat' | 'createListing' | 'default' | null = null) => {
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
        } catch (e) {
          console.error('Failed to save user', e);
        }
        return next;
      });
    }
    setIsLoggedIn(true);
    try {
      localStorage.setItem('padova_is_logged_in_v2', 'true');
    } catch (e) {
      console.error(e);
    }
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
    } catch (e) {
      console.error(e);
    }
    // Revert to home view if user is in a member-only view (profile, myListings, messages)
    if (currentView === 'profile' || currentView === 'myListings' || currentView === 'messages') {
      setCurrentView('home');
    }
  };

  // Firebase Auth State Listener & Profile Sync
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setIsLoggedIn(true);
        try {
          localStorage.setItem('padova_is_logged_in', 'true');
        } catch (e) {
          console.error(e);
        }
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
      if (firestoreListings) {
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

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('padova_housing_lang', currentLang);
    document.documentElement.lang = currentLang;
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

  // Open Chat from listing / poster
  const handleOpenChat = (username: string, subject: string) => {
    // Restrict messaging to logged-in users only
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

  // Send message in current active conversation (accepts either (conversationId, text) or (text))
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

    // Fall back to first available conversation if targetConvId is missing or invalid
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
    // Persist to Firestore
    saveListingToFirestore(listingWithCoords, currentUser.id || auth.currentUser?.uid || 'guest')
      .catch((err) => console.warn('Firestore listing persistence error:', err));
  };

  const handleDeleteListing = (id: string) => {
    setListings((prev) => prev.filter((item) => item.id !== id));
    if (detailPageListing?.id === id) {
      setDetailPageListing(null);
      setCurrentView('home');
    }
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

  // 4. "KİRACI BULDUM" WORKFLOW - Archiving listing to past listings & market data
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

    // Push notification to user
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

  // Reactivate an archived listing
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

  // 3. ADMIN AUTHORIZATION DESK (Admin yetkilendirme hash kodu yönetimi)
  const handleGrantAdminHash = (hash: string, note?: string) => {
    const trimmed = hash.trim();
    if (!trimmed || authorizedAdminHashes.includes(trimmed)) return;

    setAuthorizedAdminHashes((prev) => [...prev, trimmed]);

    if (currentUser.userHash === trimmed) {
      handleUpdateProfile({ role: 'admin' });
    }

    const newNotif: UserNotification = {
      id: `notif-${Date.now()}`,
      userId: currentUser.username,
      title: 'Admin Yetkilendirmesi Güncellendi',
      message: `"${trimmed}" hash koduna sahip yönetici başarıyla sisteme yetkili admin olarak kaydedildi.${note ? ` (${note})` : ''}`,
      type: 'admin',
      read: false,
      createdAt: 'Şimdi',
      timestamp: Date.now(),
      linkView: 'admin',
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const handleRevokeAdminHash = (hash: string) => {
    setAuthorizedAdminHashes((prev) => prev.filter((h) => h !== hash));
    if (currentUser.userHash === hash && currentUser.role !== 'superadmin') {
      handleUpdateProfile({ role: 'student' });
    }
  };

  // 1. SSO STUDENT VERIFICATION (Belgesiz UniPD Shibboleth kurumsal doğrulama)
  const handleVerifySso = () => {
    handleUpdateProfile({
      ssoVerified: true,
      studentIdVerified: true,
      ssoProvider: 'UniPD Shibboleth IdP (SAML 2.0)',
    });

    const newNotif: UserNotification = {
      id: `notif-${Date.now()}`,
      userId: currentUser.username,
      title: 'UniPD SSO Doğrulaması Başarılı',
      message: 'Università degli Studi di Padova Shibboleth IdP üzerinden kurumsal öğrenci doğrulaması tamamlandı. Hesabınıza yeşil kalkan rozeti tanımlandı.',
      type: 'security',
      read: false,
      createdAt: 'Şimdi',
      timestamp: Date.now(),
      linkView: 'profile',
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // 0. NOTIFICATIONS DESK HANDLERS (Kullanıcıya özel bildirimler)
  const handleMarkNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  // 1. DEDICATED FULL PAGE HANDLER (İlanın ismine veya detay sayfasına tıklandığında)
  const handleOpenDetailPage = (listing: HousingListing) => {
    setDetailPageListing(listing);
    setPreviewModalListing(null); // Ensure preview modal is closed
    setCurrentView('listingDetail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 2. QUICK PREVIEW POP-UP HANDLER (Önizleme butonuna veya resme tıklandığında)
  const handleOpenPreviewModal = (listing: HousingListing) => {
    setPreviewModalListing(listing);
  };

  // 3. BACK TO HOME HANDLER (İlan sayfasından çıkış)
  const handleBackToHome = () => {
    setCurrentView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filter & Sort Logic
  const filteredListings = useMemo(() => {
    const filtered = listings.filter((item) => {
      // Tab filter
      if (filters.categoryTab === 'video' && !item.hasVideoTour) return false;
      if (filters.categoryTab === 'transitorio' && !item.contractType.includes('Transitorio')) return false;
      if (filters.categoryTab === 'subentro' && !item.contractType.includes('Subentro')) return false;
      if (filters.categoryTab === 'roommates' && (!item.currentFlatmates || item.currentFlatmates.length === 0)) return false;

      // Search query
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const matches = 
          item.title.toLowerCase().includes(query) ||
          item.streetAddress.toLowerCase().includes(query) ||
          item.district.toLowerCase().includes(query) ||
          item.distanceToFaculty.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.poster.department.toLowerCase().includes(query);
        if (!matches) return false;
      }

      // Contract type
      if (filters.contractType !== 'all' && item.contractType !== filters.contractType) {
        return false;
      }

      // District
      if (filters.district !== 'all' && item.district !== filters.district) {
        return false;
      }

      // Room type
      if (filters.roomType !== 'all' && item.roomType !== filters.roomType) {
        return false;
      }

      // Max price
      if (item.price > filters.maxPrice) {
        return false;
      }

      // Video tour shield
      if (filters.onlyVideoTour && !item.hasVideoTour) {
        return false;
      }

      // Student verification shield
      if (filters.onlyStudentVerified && !item.isStudentCardVerified) {
        return false;
      }

      // High compatibility shield
      if (filters.onlyHighCompatibility && item.compatibilityScore < 85) {
        return false;
      }

      // Contract Start Date filter
      if (filters.contractStartDateFilter && filters.contractStartDateFilter !== 'all') {
        const dateStr = (item.contractStartDate || '').toLowerCase();
        if (filters.contractStartDateFilter === 'immediate') {
          const isImmediate = !item.contractStartDate || dateStr.includes('hemen') || dateStr.includes('subito') || dateStr.includes('immediate') || dateStr.includes('sofort');
          if (!isImmediate) return false;
        } else if (filters.contractStartDateFilter === 'october') {
          const isOct = dateStr.includes('ekim') || dateStr.includes('ottobre') || dateStr.includes('october') || dateStr.includes('oktober') || dateStr.includes('-10-');
          if (!isOct) return false;
        } else if (filters.contractStartDateFilter === 'november') {
          const isNov = dateStr.includes('kasım') || dateStr.includes('novembre') || dateStr.includes('november') || dateStr.includes('-11-');
          if (!isNov) return false;
        } else if (filters.contractStartDateFilter === 'spring') {
          const isSpring = dateStr.includes('şubat') || dateStr.includes('febbraio') || dateStr.includes('february') || dateStr.includes('februar') || dateStr.includes('-02-');
          if (!isSpring) return false;
        }
      }

      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (filters.categoryTab === 'newest') {
        if (a.createdAt === 'Şimdi' && b.createdAt !== 'Şimdi') return -1;
        if (b.createdAt === 'Şimdi' && a.createdAt !== 'Şimdi') return 1;
        return 0;
      }
      if (filters.sortBy === 'price-asc') return a.price - b.price;
      if (filters.sortBy === 'price-desc') return b.price - a.price;
      if (filters.sortBy === 'compatibility-desc') return b.compatibilityScore - a.compatibilityScore;
      if (filters.sortBy === 'newest') {
        if (a.createdAt === 'Şimdi' && b.createdAt !== 'Şimdi') return -1;
        if (b.createdAt === 'Şimdi' && a.createdAt !== 'Şimdi') return 1;
        return 0;
      }
      return 0; // relevance
    });

    // Son yüklenen ilanlara sadece son eklenen 8 ilan konulabilsin
    if (filters.categoryTab === 'newest') {
      return sorted.slice(0, 8);
    }

    return sorted;
  }, [listings, filters]);

  // Derived user-specific listings
  const myListings = useMemo(() => {
    if (!isLoggedIn || !currentUser) return [];
    return listings.filter((l) => {
      if (currentUser.id && l.poster.id && l.poster.id === currentUser.id) return true;
      if (currentUser.username && l.poster.username && l.poster.username.toLowerCase() === currentUser.username.toLowerCase()) return true;
      return false;
    });
  }, [listings, isLoggedIn, currentUser]);

  const favoriteListings = useMemo(() => {
    return listings.filter((l) => favoriteIds.includes(l.id));
  }, [listings, favoriteIds]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.searchQuery.trim()) count++;
    if (filters.contractType !== 'all') count++;
    if (filters.district !== 'all') count++;
    if (filters.roomType !== 'all') count++;
    if (filters.maxPrice < 900) count++;
    if (filters.onlyVideoTour) count++;
    if (filters.onlyStudentVerified) count++;
    if (filters.onlyHighCompatibility) count++;
    return count;
  }, [filters]);

  return (
    <div className="min-h-screen bg-[#f4efe4] text-[#1a1a1a] flex flex-col selection:bg-orange-200">
      {/* Top Retro Header */}
      <Header
        currentView={currentView}
        onNavigateView={(view: ActiveView) => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        filters={filters}
        onFilterChange={(updates) => setFilters((prev) => ({ ...prev, ...updates }))}
        currentLang={currentLang}
        onLangChange={setCurrentLang}
        onOpenCreateModal={handleOpenCreateListingModal}
        totalListingsCount={filteredListings.length}
        unreadMessagesCount={conversations.reduce((acc, c) => acc + c.unreadCount, 0)}
        unreadNotificationsCount={unreadNotificationsCount}
        myListingsCount={myListings.length}
        currentUser={currentUser}
        authorizedAdminHashes={authorizedAdminHashes}
        onOpenProfileSettings={() => setIsProfileSettingsOpen(true)}
        onOpenAuthModal={handleOpenAuthModal}
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
      />

      {/* Main App Canvas */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-3.5 sm:p-5 md:p-8 space-y-6 sm:space-y-8 pb-28 sm:pb-12">
        
        {/* Home / Feed View */}
        {currentView === 'home' && (
          <div className="space-y-5">
            
            {/* Mobile Search, Filter & Quick Chips Strip (Hidden on Desktop) */}
            <div className="lg:hidden space-y-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={filters.searchQuery}
                    onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
                    placeholder={t.searchPlaceholder}
                    className="w-full min-h-[46px] px-3.5 pl-10 text-base sm:text-xs border border-stone-200 bg-white rounded-xl outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 shadow-xs text-stone-900"
                  />
                  <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  {filters.searchQuery && (
                    <button
                      type="button"
                      onClick={() => setFilters((prev) => ({ ...prev, searchQuery: '' }))}
                      className="w-8 h-8 rounded-full flex items-center justify-center absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 font-bold"
                      aria-label="Clear search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(true)}
                  className="min-h-[46px] px-3.5 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl font-semibold text-xs uppercase flex items-center gap-2 shadow-xs active:translate-y-0.5 cursor-pointer shrink-0 text-stone-800"
                >
                  <Filter className="w-4 h-4 text-orange-600" />
                  <span>{t.filterDeskTitle ? t.filterDeskTitle.split(' ')[0] : 'Filters'}</span>
                  {activeFilterCount > 0 && (
                    <span className="w-5 h-5 bg-orange-600 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Quick Thumb Horizontal Filter Chips */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-2 px-2">
                <button
                  type="button"
                  onClick={() => setFilters((prev) => ({ ...prev, onlyVideoTour: !prev.onlyVideoTour }))}
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-xl border text-xs font-semibold shrink-0 flex items-center gap-1.5 active:scale-95 transition cursor-pointer ${
                    filters.onlyVideoTour ? 'bg-purple-700 border-purple-700 text-white shadow-xs' : 'bg-white text-stone-700 border-stone-200 shadow-xs'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>{t.tabVideo || '360° Video'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFilters((prev) => ({ ...prev, onlyHighCompatibility: !prev.onlyHighCompatibility }))}
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-xl border text-xs font-semibold shrink-0 flex items-center gap-1.5 active:scale-95 transition cursor-pointer ${
                    filters.onlyHighCompatibility ? 'bg-amber-600 border-amber-600 text-white shadow-xs' : 'bg-white text-stone-700 border-stone-200 shadow-xs'
                  }`}
                >
                  <Star className="w-3.5 h-3.5" />
                  <span>{t.highCompatibility}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFilters((prev) => ({ ...prev, onlyStudentVerified: !prev.onlyStudentVerified }))}
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-xl border text-xs font-semibold shrink-0 flex items-center gap-1.5 active:scale-95 transition cursor-pointer ${
                    filters.onlyStudentVerified ? 'bg-emerald-700 border-emerald-700 text-white shadow-xs' : 'bg-white text-stone-700 border-stone-200 shadow-xs'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>{t.verifiedStudent}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFilters((prev) => ({ ...prev, roomType: prev.roomType === 'Singola' ? 'all' : 'Singola' }))}
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-xl border text-xs font-semibold shrink-0 flex items-center gap-1.5 active:scale-95 transition cursor-pointer ${
                    filters.roomType === 'Singola' ? 'bg-stone-900 border-stone-900 text-white shadow-xs' : 'bg-white text-stone-700 border-stone-200 shadow-xs'
                  }`}
                >
                  <DoorClosed className="w-3.5 h-3.5" />
                  <span>{t.roomSingola}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFilters((prev) => ({ ...prev, maxPrice: prev.maxPrice <= 450 ? 900 : 450 }))}
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-xl border text-xs font-semibold shrink-0 flex items-center gap-1.5 active:scale-95 transition cursor-pointer ${
                    filters.maxPrice <= 450 ? 'bg-stone-900 border-stone-900 text-white shadow-xs' : 'bg-white text-stone-700 border-stone-200 shadow-xs'
                  }`}
                >
                  <CircleDollarSign className="w-3.5 h-3.5" />
                  <span>&lt;€450</span>
                </button>
              </div>
            </div>

            {/* Son Yüklenen İlanlar Sekmesi / Vitrini (Recently Added Listings) */}
            <RecentlyAddedSection
              listings={listings}
              t={t}
              onOpenDetailPage={handleOpenDetailPage}
              onOpenPreviewModal={setPreviewModalListing}
            />

            <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Filter & Search Desk (Visible only on Desktop lg+) */}
              <aside className="hidden lg:block lg:col-span-4 xl:col-span-3 lg:sticky lg:top-20 space-y-5">
                <CategorySidebar
                  filters={filters}
                  onFilterChange={(updates) => setFilters((prev) => ({ ...prev, ...updates }))}
                  onResetFilters={() => setFilters(DEFAULT_FILTERS)}
                  currentLang={currentLang}
                />
              </aside>

              {/* Right Column: Listings Feed (Full width on mobile, 8-9 cols on desktop) */}
              <section className="col-span-1 lg:col-span-8 xl:col-span-9 space-y-5">
              {/* Expandable/Collapsible Padova Map Section */}
              <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                {/* Collapsible Trigger Bar */}
                <div 
                  onClick={() => setIsMapSectionOpen(!isMapSectionOpen)}
                  className="p-3.5 bg-white hover:bg-stone-50/70 flex items-center justify-between gap-3 cursor-pointer select-none transition"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setIsMapSectionOpen(!isMapSectionOpen);
                    }
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl border transition-colors ${isMapSectionOpen ? 'bg-orange-600 text-white border-orange-600' : 'bg-stone-100 text-stone-800 border-stone-200'}`}>
                      <Map className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm text-stone-900 uppercase tracking-tight">
                          {t.padovaMapTitle}
                        </span>
                        <span className="bg-amber-50 border border-amber-200 text-[10px] font-semibold px-2 py-0.5 rounded-full text-amber-900">
                          {filteredListings.length} {t.listingsAndCampuses}
                        </span>
                        <span className="text-[10px] text-stone-400 font-medium hidden sm:inline">
                          (OpenStreetMap)
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 font-normal hidden sm:block">
                        {t.mapDescription}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMapSectionOpen(!isMapSectionOpen);
                      }}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition cursor-pointer flex items-center gap-1.5 ${
                        isMapSectionOpen 
                          ? 'bg-stone-900 text-white border-stone-900' 
                          : 'bg-orange-600 text-white border-orange-600 hover:bg-orange-700'
                      }`}
                    >
                      <span>{isMapSectionOpen ? t.hideMap : t.showMap}</span>
                      {isMapSectionOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Collapsible OpenStreetMap View */}
                {isMapSectionOpen && (
                  <div className="p-3 bg-stone-50 border-t border-stone-200">
                    <PadovaMap
                      listings={filteredListings}
                      onOpenDetailPage={handleOpenDetailPage}
                      onOpenPreviewModal={handleOpenPreviewModal}
                      currentLang={currentLang}
                      height="420px"
                    />
                  </div>
                )}
              </div>

              {/* Feed Count Header & Layout Mode Switcher */}
              <div className="flex flex-wrap items-center justify-between px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-700 shadow-xs gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-stone-900 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
                    <span>{filteredListings.length} {t.activeStudentListings}</span>
                  </span>
                  {filters.categoryTab === 'newest' && (
                    <span className="text-[10px] bg-orange-100 border border-orange-300 px-2 py-0.5 text-orange-900 font-bold rounded-full">
                      {currentLang === 'tr' ? 'Son Eklenen 8 İlan' :
                       currentLang === 'it' ? 'Ultimi 8 Annunci' :
                       currentLang === 'de' ? 'Neueste 8 Inserate' :
                       currentLang === 'ru' ? 'Последние 8 объявлений' :
                       currentLang === 'hi' ? 'नवीनतम 8 विज्ञापन' :
                       'Latest 8 Listings'}
                    </span>
                  )}
                  {filters.district !== 'all' && (
                    <span className="text-[10px] bg-orange-50 border border-orange-200 px-2 py-0.5 text-orange-950 font-medium rounded-full">
                      {filters.district}
                    </span>
                  )}
                </div>

                {/* Grid Mode Selector (Çift Satır / Tek Satır) */}
                <div className="flex items-center gap-1 bg-stone-100 border border-stone-200 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => handleSetGridLayout('double')}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-md flex items-center gap-1.5 transition cursor-pointer ${
                      gridLayout === 'double'
                        ? 'bg-white text-stone-900 shadow-xs font-bold'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                    title={t.gridDouble}
                  >
                    <Grid2X2 className="w-3.5 h-3.5 text-orange-600" />
                    <span>{t.gridDouble}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetGridLayout('single')}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-md flex items-center gap-1.5 transition cursor-pointer ${
                      gridLayout === 'single'
                        ? 'bg-white text-stone-900 shadow-xs font-bold'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                    title={t.gridSingle}
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>{t.gridSingle}</span>
                  </button>
                </div>
              </div>

              {/* Listing Cards */}
              {filteredListings.length === 0 ? (
                <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
                    <Search className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-base text-zinc-900">
                    {listings.length === 0
                      ? (currentLang === 'tr' ? 'Henüz Yayınlanmış İlan Bulunmuyor' :
                         currentLang === 'it' ? 'Nessun annuncio pubblicato finora' :
                         currentLang === 'de' ? 'Noch keine Inserate vorhanden' :
                         currentLang === 'ru' ? 'Пока нет опубликованных объявлений' :
                         currentLang === 'hi' ? 'अभी तक कोई विज्ञापन प्रकाशित नहीं हुआ है' :
                         'No Listings Published Yet')
                      : t.noListingsFound}
                  </h3>
                  <p className="text-xs text-zinc-600 max-w-md mx-auto">
                    {listings.length === 0
                      ? (currentLang === 'tr' ? 'Tüm mock/örnek ilanlar kaldırıldı. Kendi ilanınızı ekleyip akışı manuel olarak test etmek için aşağıdaki butona tıklayın.' :
                         currentLang === 'it' ? 'Gli annunci di esempio sono stati rimossi. Fai clic sul pulsante qui sotto per aggiungere il tuo annuncio e testarlo manualmente.' :
                         currentLang === 'de' ? 'Beispielinserate wurden entfernt. Klicken Sie auf die Schaltfläche unten, um Ihr eigenes Inserat hinzuzufügen und manuell zu testen.' :
                         currentLang === 'ru' ? 'Примеры объявлений удалены. Нажмите кнопку ниже, чтобы добавить свое объявление и протестировать его вручную.' :
                         currentLang === 'hi' ? 'नमूना विज्ञापन हटा दिए गए हैं। अपना विज्ञापन जोड़ने और मैन्युअल रूप से परीक्षण करने के लिए नीचे दिए गए बटन पर क्लिक करें।' :
                         'Mock listings have been removed. Click the button below to post your own listing and test manually.')
                      : t.noListingsSub}
                  </p>
                  <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
                    {listings.length === 0 ? (
                      <button
                        type="button"
                        onClick={handleOpenCreateListingModal}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider min-h-[44px] transition cursor-pointer shadow-xs flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{t.postAdBtn}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setFilters(DEFAULT_FILTERS)}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider min-h-[44px] transition cursor-pointer shadow-xs"
                      >
                        {t.resetFilters}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className={gridLayout === 'double' ? 'grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch' : 'space-y-4'}>
                  {filteredListings.map((listing) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      isFavorite={favoriteIds.includes(listing.id)}
                      onToggleFavorite={(e) => handleToggleFavorite(e, listing.id)}
                      onOpenDetailPage={handleOpenDetailPage}
                      onOpenPreviewModal={handleOpenPreviewModal}
                      onOpenVideoModal={setVideoModalListing}
                      onOpenChat={handleOpenChat}
                      currentLang={currentLang}
                      layoutMode={gridLayout}
                    />
                  ))}
                </div>
              )}
            </section>
          </main>
        </div>
      )}

        {/* Dedicated Full Listing Detail Page View */}
        {currentView === 'listingDetail' && (
          detailPageListing ? (
            <ListingDetailPage
              listing={detailPageListing}
              isFavorite={favoriteIds.includes(detailPageListing.id)}
              onToggleFavorite={(id) => handleToggleFavorite(undefined, id)}
              onBackToHome={handleBackToHome}
              onOpenChat={handleOpenChat}
              onOpenVideoTourModal={setVideoModalListing}
              currentLang={currentLang}
            />
          ) : (
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8 text-center space-y-3">
              <h3 className="font-bold text-base text-stone-900">{t.noListingsFound}</h3>
              <p className="text-xs text-stone-500">{t.noListingsSub}</p>
              <button
                onClick={handleBackToHome}
                className="bg-stone-900 hover:bg-stone-800 text-white px-5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider min-h-[44px] transition cursor-pointer"
              >
                ← {t.backToHome}
              </button>
            </div>
          )
        )}

        {currentView === 'myListings' && (
          <MyListingsView
            myListings={myListings}
            archivedListings={archivedListings}
            onOpenCreateModal={handleOpenCreateListingModal}
            onSelectListing={handleOpenDetailPage}
            onOpenVideoTour={setVideoModalListing}
            onDeleteListing={handleDeleteListing}
            onMarkAsRented={handleMarkListingAsRented}
            onReactivateListing={handleReactivateListing}
            onBackToHome={handleBackToHome}
            currentLang={currentLang}
            currentUser={currentUser}
          />
        )}

        {currentView === 'messages' && (
          isLoggedIn ? (
            <MessagesView
              conversations={conversations}
              activeConversationId={activeConversationId}
              onSelectConversation={setActiveConversationId}
              onSendMessage={handleSendMessage}
              onBackToHome={handleBackToHome}
              currentLang={currentLang}
            />
          ) : (
            <div className="max-w-xl mx-auto py-12 px-6 text-center bg-white rounded-2xl border border-stone-200 shadow-sm space-y-4">
              <div className="w-16 h-16 bg-amber-50 border border-amber-200 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                <MessageSquare className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-stone-900">
                  {currentLang === 'tr' ? 'Mesajlaşmak İçin Giriş Yapmalısınız' :
                   currentLang === 'it' ? 'Accesso Richiesto per Messaggiare' :
                   currentLang === 'de' ? 'Anmeldung Erforderlich zum Nachrichten' :
                   currentLang === 'ru' ? 'Для сообщений требуется профиль' :
                   currentLang === 'hi' ? 'मैसेज करने के लिए लॉगिन आवश्यक है' :
                   'Login Required to Message'}
                </h2>
                <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed">
                  {currentLang === 'tr' ? 'Padova Güvenli Öğrenci Ağı kuralı gereğince, ilan sahipleri ve potansiyel ev arkadaşlarıyla mesajlaşabilmek için onaylı bir hesaba ve profile sahip olmanız gerekmektedir.' :
                   currentLang === 'it' ? 'In base alle regole della Rete Studentesca Sicura di Padova, è necessario avere un profilo e un account verificato per messaggiare con i proprietari.' :
                   currentLang === 'de' ? 'Gemäß den Regeln des Sicheren Studentennetzwerks von Padua müssen Sie über ein verifiziertes Profil und Konto verfügen, um Nachrichten zu senden.' :
                   currentLang === 'ru' ? 'Для безопасного общения в Падуе вам необходим подтвержденный профиль и аккаунт.' :
                   currentLang === 'hi' ? 'पादोवा छात्र सुरक्षा नेटवर्क के नियमानुसार संदेश भेजने के लिए एक सत्यापित प्रोफ़ाइल आवश्यक है।' :
                   'According to the Padova Safe Student Network rules, messaging listing owners and roommates requires an active profile and verified account.'}
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleOpenAuthModal('login', 'chat')}
                  className="bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs transition cursor-pointer min-h-[42px]"
                >
                  {t.loginNav}
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenAuthModal('register', 'chat')}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold px-5 py-2.5 rounded-xl transition cursor-pointer min-h-[42px]"
                >
                  {t.registerNav}
                </button>
                <button
                  type="button"
                  onClick={handleBackToHome}
                  className="text-stone-500 hover:text-stone-800 text-xs font-medium px-3 py-2.5 transition cursor-pointer min-h-[42px]"
                >
                  {t.backToHome}
                </button>
              </div>
            </div>
          )
        )}

        {currentView === 'profile' && (
          <ProfileView
            favoriteListings={favoriteListings}
            onSelectListing={handleOpenDetailPage}
            onBackToHome={handleBackToHome}
            currentLang={currentLang}
            currentUser={currentUser}
            isLoggedIn={isLoggedIn}
            onOpenProfileSettings={() => setIsProfileSettingsOpen(true)}
            onVerifySso={handleVerifySso}
            onOpenAuthModal={handleOpenAuthModal}
          />
        )}

        {currentView === 'admin' && (
          <AdminPanel
            listings={listings}
            archivedListings={archivedListings}
            onDeleteListing={handleDeleteListing}
            onToggleVerifyListing={handleToggleVerifyListing}
            onToggleVideoVerified={handleToggleVideoVerified}
            onUpdateListingPrice={handleUpdateListingPrice}
            onBackToHome={handleBackToHome}
            currentLang={currentLang}
            currentUser={currentUser}
            authorizedAdminHashes={authorizedAdminHashes}
            onGrantAdminHash={handleGrantAdminHash}
            onRevokeAdminHash={handleRevokeAdminHash}
          />
        )}

        {currentView === 'notifications' && (
          <NotificationsView
            notifications={notifications}
            onMarkAllAsRead={handleMarkAllNotificationsAsRead}
            onMarkAsRead={handleMarkNotificationAsRead}
            onDeleteNotification={handleDeleteNotification}
            onClearAll={handleClearAllNotifications}
            onNavigateView={(view: ActiveView, linkId?: string) => {
              if (view === 'messages' && linkId) {
                setActiveConversationId(linkId);
              }
              setCurrentView(view);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onBackToHome={handleBackToHome}
            currentLang={currentLang}
          />
        )}

      </div>

      {/* Video Tour Simulation Modal */}
      <VideoTourModal
        listing={videoModalListing}
        onClose={() => setVideoModalListing(null)}
        currentLang={currentLang}
      />

      {/* Quick Preview Pop-up Modal (Önizleme Kısmı - Kısa bilgiler, Pop-up) */}
      <ListingDetailModal
        listing={previewModalListing}
        onClose={() => setPreviewModalListing(null)}
        isFavorite={previewModalListing ? favoriteIds.includes(previewModalListing.id) : false}
        onToggleFavorite={(id) => handleToggleFavorite(undefined, id)}
        onOpenDetailPage={handleOpenDetailPage}
        onOpenVideoTour={setVideoModalListing}
        onOpenChat={handleOpenChat}
        currentLang={currentLang}
      />

      {/* Create / Post New Listing Modal */}
      <CreateListingModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onAddListing={handleAddListing}
        currentLang={currentLang}
        currentUser={currentUser}
        isLoggedIn={isLoggedIn}
        onOpenAuthModal={handleOpenAuthModal}
      />

      {/* Mobile Filter Bottom Drawer */}
      <MobileFilterDrawer
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        filters={filters}
        onFilterChange={(updates) => setFilters((prev) => ({ ...prev, ...updates }))}
        onResetFilters={() => setFilters(DEFAULT_FILTERS)}
        filteredCount={filteredListings.length}
        currentLang={currentLang}
      />

      {/* Floating Live Communication Desk (Visible only for registered/logged-in users) */}
      {isLoggedIn && (
        <ChatWidget
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={setActiveConversationId}
          onSendMessage={handleSendMessage}
          isOpen={isChatOpen}
          onToggle={() => setIsChatOpen(!isChatOpen)}
          currentLang={currentLang}
        />
      )}

      {/* Mobile-First Sticky Thumb Bottom Navigation Bar */}
      <MobileBottomNav
        currentView={currentView}
        onNavigateView={(view: ActiveView) => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenCreateModal={handleOpenCreateListingModal}
        onToggleMapSection={() => setIsMapSectionOpen((prev) => !prev)}
        isMapOpen={isMapSectionOpen}
        unreadMessagesCount={conversations.reduce((acc, c) => acc + c.unreadCount, 0)}
        unreadNotificationsCount={unreadNotificationsCount}
        currentLang={currentLang}
        currentUser={currentUser}
        isLoggedIn={isLoggedIn}
        onOpenAuthModal={handleOpenAuthModal}
      />

      {/* Profile Settings Modal (Profil Ayarları - Profil Fotoğrafı & Şifre Değiştirme) */}
      <ProfileSettingsModal
        isOpen={isProfileSettingsOpen}
        onClose={() => setIsProfileSettingsOpen(false)}
        currentUser={currentUser}
        onUpdateProfile={handleUpdateProfile}
        currentLang={currentLang}
      />

      {/* Auth / Forgot Password Modal (Şifremi Unuttum & Giriş Akışı) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setAuthModalReason(null);
        }}
        initialMode={authModalMode}
        currentLang={currentLang}
        userEmail={currentUser.email}
        onLoginSuccess={handleLoginSuccess}
        authReason={authModalReason}
      />
    </div>
  );
};

export default App;
