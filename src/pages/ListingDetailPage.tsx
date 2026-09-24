import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ListingDetailPage as ListingDetailComponent } from '../components/ListingDetailPage';
import { recordListingView } from '../services/supabaseService';
import { shouldCountView } from '../utils/viewTracking';
import { ArrowLeft, Home, Building2, Share2, Check } from 'lucide-react';

export const ListingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    listings, 
    archivedListings, 
    favoriteIds, 
    handleToggleFavorite, 
    handleOpenChat, 
    setVideoModalListing,
    handleOpenEditListingModal,
    currentUser,
    isLoggedIn,
    currentLang,
    listingsLoaded,
    authReady,
    t
  } = useApp();

  // Scroll to top when listing detail page opens
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  // Find listing by ID from active listings or archived listings
  const listing = listings.find((l) => l.id === id) || archivedListings.find((l) => l.id === id);

  // Görüntülenme sayacı: oturum netleştikten sonra (sahibin kendi bakışı sunucuda elenir) 24 saatte bir sayılır.
  const listingId = listing?.id;
  const isCountable = Boolean(listing && !listing.isArchived);
  const isOwnListing = Boolean(
    listing && currentUser?.id && (listing.userId === currentUser.id || listing.poster?.id === currentUser.id)
  );
  useEffect(() => {
    if (!listingId || !authReady || !isCountable || isOwnListing) return;
    if (shouldCountView(listingId)) recordListingView(listingId);
  }, [listingId, authReady, isCountable, isOwnListing]);

  // Liste henüz gelmediyse (paylaşılan link, boş önbellek) "bulunamadı" yerine boş bırak.
  if (!listing && (!listingsLoaded || !authReady)) return null;

  if (!listing) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-5 bg-white rounded-3xl border border-stone-200 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto shadow-xs">
          <Building2 className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-stone-900">{t.listingNotFoundTitle}</h2>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            {t.listingNotFoundBody.replace('{id}', id ?? '')}
          </p>
        </div>
        <div className="pt-2">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-sm cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>{t.backToHome}</span>
          </button>
        </div>
      </div>
    );
  }

  const isFavorite = favoriteIds.includes(listing.id);

  return (
    <ListingDetailComponent
      listing={listing}
      isFavorite={isFavorite}
      onToggleFavorite={(listingId) => handleToggleFavorite(undefined, listingId)}
      onBackToHome={() => navigate('/')}
      onOpenChat={(username, subject, listingId) => handleOpenChat(username, subject, listingId)}
      onOpenVideoTourModal={(l) => setVideoModalListing(l)}
      onEditListing={(l) => handleOpenEditListingModal(l)}
      currentUser={currentUser}
      isLoggedIn={isLoggedIn}
      currentLang={currentLang}
    />
  );
};
