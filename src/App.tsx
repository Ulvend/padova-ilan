import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AppProvider, useApp, DEFAULT_FILTERS } from './context/AppContext';
import { Header } from './components/Header';
import { MobileBottomNav } from './components/MobileBottomNav';
import { MobileFilterDrawer } from './components/MobileFilterDrawer';
import { VideoTourModal } from './components/VideoTourModal';
import { ListingDetailModal } from './components/ListingDetailModal';
import { CreateListingModal } from './components/CreateListingModal';
import { ProfileSettingsModal } from './components/ProfileSettingsModal';
import { AuthModal } from './components/AuthModal';
import { ChatWidget } from './components/ChatWidget';
import { HomePage } from './pages/HomePage';
import { ListingDetailPage } from './pages/ListingDetailPage';
import { MyListingsPage } from './pages/MyListingsPage';
import { MessagesPage } from './pages/MessagesPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ActiveView, HousingListing } from './types';

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
    setEditingListing,
    handleAddListing,
    handleUpdateListing,
    isProfileSettingsOpen,
    handleUpdateProfile,
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
  } = useApp();

  const handleNavigateView = (view: ActiveView) => {
    navigate(VIEW_TO_PATH[view] || '/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Hata olursa CreateListingModal yakalar ve kullanıcıya gösterir; modal açık kalır.
  const onListingCreated = async (newListing: HousingListing) => {
    await handleAddListing(newListing);
    setIsCreateModalOpen(false);
    navigate(`/ilan/${newListing.id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
        onOpenProfileSettings={() => setIsProfileSettingsOpen(true)}
        onOpenAuthModal={handleOpenAuthModal}
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
      />

      {/* Main Canvas with React Router Routes */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-3.5 sm:p-5 md:p-8 space-y-6 sm:space-y-8 pb-28 sm:pb-12">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/ilan/:id" element={<ListingDetailPage />} />
          <Route path="/ilanlarim" element={<MyListingsPage />} />
          <Route path="/mesajlar" element={<MessagesPage />} />
          <Route path="/profil" element={<ProfilePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/bildirimler" element={<NotificationsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

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
        unreadMessagesCount={unreadMessagesCount}
        unreadNotificationsCount={unreadNotificationsCount}
        currentLang={currentLang}
        currentUser={currentUser}
        isLoggedIn={isLoggedIn}
        onOpenAuthModal={handleOpenAuthModal}
      />

      {/* Modals & Overlays */}
      <VideoTourModal
        listing={videoModalListing}
        onClose={() => setVideoModalListing(null)}
        currentLang={currentLang}
      />

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

      <CreateListingModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingListing(null);
        }}
        initialListing={editingListing}
        isEditMode={Boolean(editingListing)}
        onAddListing={onListingCreated}
        onSubmitListing={onListingCreated}
        onUpdateListing={handleUpdateListing}
        currentLang={currentLang}
        currentUser={currentUser}
        isLoggedIn={isLoggedIn}
        onOpenAuthModal={handleOpenAuthModal}
      />

      <ProfileSettingsModal
        isOpen={isProfileSettingsOpen}
        onClose={() => setIsProfileSettingsOpen(false)}
        currentUser={currentUser}
        onUpdateProfile={handleUpdateProfile}
        currentLang={currentLang}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        currentLang={currentLang}
        onLoginSuccess={handleLoginSuccess}
        authReason={authModalReason}
      />

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
            aria-label="Kapat"
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
