import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { AdminPanel } from '../components/AdminPanel';
import { PublicUserProfile, subscribeToVerifiedUsers } from '../services/firebaseService';

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
    isAdmin,
    isSuperAdmin,
    authorizedAdminHashes,
    handleGrantAdminHash,
    handleRevokeAdminHash,
  } = useApp();

  const [verifiedUsers, setVerifiedUsers] = useState<PublicUserProfile[]>([]);

  useEffect(() => {
    if (!isAdmin) return;
    return subscribeToVerifiedUsers(setVerifiedUsers);
  }, [isAdmin]);

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
      isAdmin={isAdmin}
      isSuperAdmin={isSuperAdmin}
      verifiedUsers={verifiedUsers}
      authorizedAdminHashes={authorizedAdminHashes}
      onGrantAdminHash={handleGrantAdminHash}
      onRevokeAdminHash={handleRevokeAdminHash}
    />
  );
};
