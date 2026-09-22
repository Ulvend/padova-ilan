import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ProfileView } from '../components/ProfileView';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    listings,
    favoriteIds,
    currentLang,
    currentUser,
    isLoggedIn,
    setIsProfileSettingsOpen,
    handleOpenAuthModal,
    handleUpdateProfile,
  } = useApp();

  const favoriteListings = listings.filter((l) => favoriteIds.includes(l.id));

  const handleVerifySso = () => {
    handleUpdateProfile({
      studentIdVerified: true,
      ssoVerified: true,
      ssoProvider: 'UniPD Shibboleth SSO',
    });
  };

  return (
    <ProfileView
      favoriteListings={favoriteListings}
      onSelectListing={(listing) => navigate(`/ilan/${listing.id}`)}
      onBackToHome={() => navigate('/')}
      currentLang={currentLang}
      currentUser={currentUser}
      isLoggedIn={isLoggedIn}
      onOpenProfileSettings={() => setIsProfileSettingsOpen(true)}
      onVerifySso={handleVerifySso}
      onOpenAuthModal={handleOpenAuthModal}
    />
  );
};
