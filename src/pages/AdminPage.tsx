import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { AdminPanel } from '../components/AdminPanel';

export const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    listings,
    archivedListings,
    handleDeleteListing,
    handleToggleVerifyListing,
    handleToggleVideoVerified,
    handleUpdateListingPrice,
    currentLang,
    currentUser,
    authorizedAdminHashes,
    handleGrantAdminHash,
    handleRevokeAdminHash,
  } = useApp();

  return (
    <AdminPanel
      listings={listings}
      archivedListings={archivedListings}
      onDeleteListing={handleDeleteListing}
      onToggleVerifyListing={handleToggleVerifyListing}
      onToggleVideoVerified={handleToggleVideoVerified}
      onUpdateListingPrice={handleUpdateListingPrice}
      onBackToHome={() => navigate('/')}
      currentLang={currentLang}
      currentUser={currentUser}
      authorizedAdminHashes={authorizedAdminHashes}
      onGrantAdminHash={handleGrantAdminHash}
      onRevokeAdminHash={handleRevokeAdminHash}
    />
  );
};
