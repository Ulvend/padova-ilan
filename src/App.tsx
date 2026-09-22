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
import { ActiveView } from './types';

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
    authorizedAdminHashes,
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
    handleAddListing,
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
  } = useApp();

  const handleNavigateView = (view: ActiveView) => {
    navigate(VIEW_TO_PATH[view] || '/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onListingCreated = (newListing: any) => {
    handleAddListing(newListing);
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
        authorizedAdminHashes={authorizedAdminHashes}
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
        totalResultsCount={filteredListings.length}
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
        onOpenChat={(user, subject) => {
          setPreviewModalListing(null);
          handleOpenChat(user, subject);
        }}
      />

      <CreateListingModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onAddListing={onListingCreated}
        onSubmitListing={onListingCreated}
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
        reason={authModalReason}
      />

      {isChatOpen && (
        <ChatWidget
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={setActiveConversationId}
          onSendMessage={handleSendMessage}
          onClose={() => setIsChatOpen(false)}
          currentLang={currentLang}
        />
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
