import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { MyListingsView } from '../components/MyListingsView';

export const MyListingsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    myListings,
    archivedListings,
    handleOpenCreateListingModal,
    handleOpenEditListingModal,
    setVideoModalListing,
    handleDeleteListing,
    handleMarkListingAsRented,
    handleReactivateListing,
    currentLang,
    currentUser,
  } = useApp();

  return (
    <MyListingsView
      myListings={myListings}
      archivedListings={archivedListings}
      onOpenCreateModal={handleOpenCreateListingModal}
      onEditListing={handleOpenEditListingModal}
      onSelectListing={(listing) => navigate(`/ilan/${listing.id}`)}
      onOpenVideoTour={(listing) => setVideoModalListing(listing)}
      onDeleteListing={handleDeleteListing}
      onMarkAsRented={handleMarkListingAsRented}
      onReactivateListing={handleReactivateListing}
      onBackToHome={() => navigate('/')}
      currentLang={currentLang}
      currentUser={currentUser}
    />
  );
};
