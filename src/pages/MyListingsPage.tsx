import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { MyListingsView } from '../components/MyListingsView';
import { LoginRequired } from '../components/LoginRequired';
import { getListingViewCounts } from '../services/supabaseService';

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
    isLoggedIn,
    authReady,
  } = useApp();

  // Görüntülenme sayaçları listings'ten ayrı tutulur; sayfa açılınca ve ilan listesi değişince çekilir.
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});
  const listingIdsKey = [...myListings, ...archivedListings].map((l) => l.id).sort().join(',');
  useEffect(() => {
    if (!isLoggedIn || !listingIdsKey) return;
    let cancelled = false;
    getListingViewCounts(listingIdsKey.split(',')).then((counts) => {
      if (!cancelled) setViewCounts(counts);
    });
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, listingIdsKey]);

  // Oturum yüklenirken giriş kapısı yanıp sönmesin.
  if (!authReady) return null;
  if (!isLoggedIn) return <LoginRequired />;

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
      viewCounts={viewCounts}
    />
  );
};
