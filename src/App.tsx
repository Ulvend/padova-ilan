import React, { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AppProvider, useApp, DEFAULT_FILTERS } from './context/AppContext';
import { Header } from './components/Header';
import { MobileBottomNav } from './components/MobileBottomNav';
import { MobileFilterDrawer } from './components/MobileFilterDrawer';
import { HomePage } from './pages/HomePage';
import { Footer } from './components/Footer';
import { ActiveView } from './types';

// Ana sayfa dışındaki sayfalar ve modallar ilk açılışta indirilmez; ilk kullanıldıklarında ayrı parça olarak yüklenir
// (ör. yönetim paneli, ilan sihirbazı ve harita kitaplığı yalnızca ihtiyacı olana gider).
const CreateListingRoute = lazy(() => import('./pages/CreateListingPage').then((m) => ({ default: m.CreateListingRoute })));
const ListingDetailPage = lazy(() => import('./pages/ListingDetailPage').then((m) => ({ default: m.ListingDetailPage })));
const MyListingsPage = lazy(() => import('./pages/MyListingsPage').then((m) => ({ default: m.MyListingsPage })));
const MessagesPage = lazy(() => import('./pages/MessagesPage').then((m) => ({ default: m.MessagesPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then((m) => ({ default: m.AdminPage })));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage').then((m) => ({ default: m.NotificationsPage })));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage').then((m) => ({ default: m.PrivacyPage })));
const VideoTourModal = lazy(() => import('./components/VideoTourModal').then((m) => ({ default: m.VideoTourModal })));
const ListingDetailModal = lazy(() => import('./components/ListingDetailModal').then((m) => ({ default: m.ListingDetailModal })));
const ProfileSettingsModal = lazy(() => import('./components/ProfileSettingsModal').then((m) => ({ default: m.ProfileSettingsModal })));
const AuthModal = lazy(() => import('./components/AuthModal').then((m) => ({ default: m.AuthModal })));
const ChatWidget = lazy(() => import('./components/ChatWidget').then((m) => ({ default: m.ChatWidget })));

/** Bir modal ilk kez açılana kadar parçası indirilmez; açıldıktan sonra (kapanış animasyonları için) bağlı kalır. */
const useEverOpened = (open: boolean): boolean => {
  const [opened, setOpened] = useState(open);
  useEffect(() => {
    if (open) setOpened(true);
  }, [open]);
  return opened || open;
};

const PageFallback: React.FC = () => (
  <div role="status" aria-live="polite" className="flex min-h-[40vh] items-center justify-center text-sm text-stone-500">
    <span className="h-5 w-5 animate-spin rounded-full border-2 border-stone-300 border-t-orange-600" aria-hidden="true" />
    <span className="sr-only">Loading…</span>
  </div>
);

const VIEW_TO_PATH: Record<ActiveView, string> = {
  home: '/',
  listingDetail: '/',
  myListings: '/ilanlarim',
  messages: '/mesajlar',
  profile: '/profil',
  admin: '/admin',
  notifications: '/bildirimler',
};

const getActiveViewFromPath = (pathname: string): ActiveView => {
  if (pathname.startsWith('/ilan/')) return 'listingDetail';
  if (pathname.startsWith('/ilanlarim')) return 'myListings';
  if (pathname.startsWith('/mesajlar')) return 'messages';
  if (pathname.startsWith('/profil')) return 'profile';
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/bildirimler')) return 'notifications';
  return 'home';
};

const AppLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentView = getActiveViewFromPath(location.pathname);

  const {
    filters,
    setFilters,
    currentLang,
    setCurrentLang,
    handleOpenCreateListingModal,
    filteredListings,
    myListings,
    unreadMessagesCount,
    unreadNotificationsCount,
    currentUser,
    setIsProfileSettingsOpen,
    handleOpenAuthModal,
    isLoggedIn,
    handleLogout,
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
    editingListing,
    isProfileSettingsOpen,
    handleUpdateProfile,
    handleChangeUsername,
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalMode,
    authModalReason,
    handleLoginSuccess,
    isChatOpen,
    setIsChatOpen,
    conversations,
    activeConversationId,
    setActiveConversationId,
    handleSendMessage,
    favoriteIds,
    handleToggleFavorite,
    handleOpenChat,
    isAdmin,
    toast,
    dismissToast,
    t,
  } = useApp();

  const authModalMounted = useEverOpened(isAuthModalOpen);
  const profileModalMounted = useEverOpened(isProfileSettingsOpen);
  const previewModalMounted = useEverOpened(Boolean(previewModalListing));
  const videoModalMounted = useEverOpened(Boolean(videoModalListing));

  const handleNavigateView = (view: ActiveView) => {
    navigate(VIEW_TO_PATH[view] || '/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // "İlan ver" / "Düzenle" istekleri (context bayrağı) tam sayfa sihirbaz rotasına yönlendirilir.
  useEffect(() => {
    if (!isCreateModalOpen) return;
    setIsCreateModalOpen(false);
    navigate(editingListing ? `/ilan-ver/${editingListing.id}` : '/ilan-ver');
  }, [isCreateModalOpen, editingListing, navigate, setIsCreateModalOpen]);

  // Sihirbaz kendi tam sayfa düzenini kullanır: üst menü, alt menü ve sohbet yok.
  if (location.pathname.startsWith('/ilan-ver')) {
    return (
      <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-orange-500/20 selection:text-orange-900">
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/ilan-ver/:id?" element={<CreateListingRoute />} />
          </Routes>
        </Suspense>
        {authModalMounted && (
          <Suspense fallback={null}>
            <AuthModal
              isOpen={isAuthModalOpen}
              onClose={() => setIsAuthModalOpen(false)}
              initialMode={authModalMode}
              currentLang={currentLang}
              onLoginSuccess={handleLoginSuccess}
              authReason={authModalReason}
            />
          </Suspense>
        )}
        {toast && (
          <div
            role={toast.type === 'error' ? 'alert' : 'status'}
            className="fixed z-[60] left-1/2 -translate-x-1/2 bottom-24 w-[calc(100%-2rem)] max-w-md px-4 py-3 rounded-xl shadow-lg border border-stone-200 bg-white text-sm text-stone-800"
          >
            {toast.text}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 flex flex-col font-sans selection:bg-orange-500/20 selection:text-orange-900">
      {/* Top Header / Navigation Bar */}
      <Header
        currentView={currentView}
        onNavigateView={handleNavigateView}
        filters={filters}
        onFilterChange={(updates) => setFilters((prev) => ({ ...prev, ...updates }))}
        currentLang={currentLang}
        onLangChange={setCurrentLang}
        onOpenCreateModal={handleOpenCreateListingModal}
        totalListingsCount={filteredListings.length}
        unreadMessagesCount={unreadMessagesCount}
        unreadNotificationsCount={unreadNotificationsCount}
        myListingsCount={myListings.length}
        currentUser={currentUser}
        isAdmin={isAdmin}
        onOpenAuthModal={handleOpenAuthModal}
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
      />

      {/* Main Canvas with React Router Routes */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-3.5 sm:p-5 md:p-8 space-y-6 sm:space-y-8 pb-6 sm:pb-12">
        <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/ilan/:id" element={<ListingDetailPage />} />
          <Route path="/ilanlarim" element={<MyListingsPage />} />
          <Route path="/mesajlar" element={<MessagesPage />} />
          <Route path="/profil" element={<ProfilePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/bildirimler" element={<NotificationsPage />} />
          <Route path="/gizlilik" element={<PrivacyPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </div>

      {/* Alt bilgi: gizlilik ve çerez politikası (mobilde alt menünün üstünde kalması için kendi boşluğunu taşır) */}
      <Footer />

      {/* Mobile Filter Drawer */}
      <MobileFilterDrawer
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        filters={filters}
        onFilterChange={(updates) => setFilters((prev) => ({ ...prev, ...updates }))}
        onResetFilters={() => setFilters(DEFAULT_FILTERS)}
        currentLang={currentLang}
        filteredCount={filteredListings.length}
      />

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        currentView={currentView}
        onNavigateView={handleNavigateView}
        onOpenCreateModal={handleOpenCreateListingModal}
        onToggleMapSection={() => setIsMapSectionOpen((prev) => !prev)}
        isMapOpen={isMapSectionOpen}
        unreadNotificationsCount={unreadNotificationsCount}
        currentLang={currentLang}
        currentUser={currentUser}
        isLoggedIn={isLoggedIn}
        onOpenAuthModal={handleOpenAuthModal}
      />

      {/* Modals & Overlays */}
      {videoModalMounted && (
      <Suspense fallback={null}>
      <VideoTourModal
        listing={videoModalListing}
        onClose={() => setVideoModalListing(null)}
        currentLang={currentLang}
      />
      </Suspense>
      )}

      {previewModalMounted && (
      <Suspense fallback={null}>
      <ListingDetailModal
        listing={previewModalListing}
        isOpen={!!previewModalListing}
        onClose={() => setPreviewModalListing(null)}
        currentLang={currentLang}
        isFavorite={Boolean(previewModalListing && favoriteIds.includes(previewModalListing.id))}
        onToggleFavorite={(id) => handleToggleFavorite(undefined, id)}
        onOpenDetailPage={(l) => {
          setPreviewModalListing(null);
          navigate(`/ilan/${l.id}`);
        }}
        onOpenDirectDetailPage={(l) => {
          setPreviewModalListing(null);
          navigate(`/ilan/${l.id}`);
        }}
        onOpenVideoTour={(l) => {
          setPreviewModalListing(null);
          setVideoModalListing(l);
        }}
        onOpenChat={(user, subject, listingId) => {
          setPreviewModalListing(null);
          handleOpenChat(user, subject, listingId);
        }}
      />
      </Suspense>
      )}

      {profileModalMounted && (
      <Suspense fallback={null}>
      <ProfileSettingsModal
        isOpen={isProfileSettingsOpen}
        onClose={() => setIsProfileSettingsOpen(false)}
        currentUser={currentUser}
        onUpdateProfile={handleUpdateProfile}
        onChangeUsername={handleChangeUsername}
        currentLang={currentLang}
      />
      </Suspense>
      )}

      {authModalMounted && (
      <Suspense fallback={null}>
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        currentLang={currentLang}
        onLoginSuccess={handleLoginSuccess}
        authReason={authModalReason}
      />
      </Suspense>
      )}

      {isLoggedIn && (
        <Suspense fallback={null}>
        <ChatWidget
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={setActiveConversationId}
          onSendMessage={handleSendMessage}
          isOpen={isChatOpen}
          onToggle={() => setIsChatOpen(!isChatOpen)}
          currentLang={currentLang}
        />
        </Suspense>
      )}

      {/* Kısa bilgilendirme / hata mesajı */}
      {toast && (
        <div
          role={toast.type === 'error' ? 'alert' : 'status'}
          className={`fixed z-[60] left-1/2 -translate-x-1/2 bottom-24 sm:bottom-6 w-[calc(100%-2rem)] max-w-md px-4 py-3 rounded-xl shadow-lg border text-sm flex items-start gap-3 ${
            toast.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-white border-stone-200 text-stone-800'
          }`}
        >
          <span className="flex-1 leading-snug">{toast.text}</span>
          <button
            type="button"
            onClick={dismissToast}
            className="text-xs font-bold opacity-60 hover:opacity-100 cursor-pointer"
            aria-label={t.closeBtn}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </AppProvider>
  );
};

export default App;
