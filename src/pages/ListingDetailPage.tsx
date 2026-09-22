import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ListingDetailPage as ListingDetailComponent } from '../components/ListingDetailPage';
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
    t
  } = useApp();

  // Scroll to top when listing detail page opens
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  // Find listing by ID from active listings or archived listings
  const listing = listings.find((l) => l.id === id) || archivedListings.find((l) => l.id === id);

  if (!listing) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-5 bg-white rounded-3xl border border-stone-200 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto shadow-xs">
          <Building2 className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-stone-900">İlan Bulunamadı</h2>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Aradığınız ilan ID'si ({id}) artık yayında olmayabilir veya kiralanmış olabilir.
          </p>
        </div>
        <div className="pt-2">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-sm cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>{t.backToHome || 'Ana Sayfaya Dön'}</span>
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
      onOpenChat={(username, subject) => handleOpenChat(username, subject)}
      onOpenVideoTourModal={(l) => setVideoModalListing(l)}
      onEditListing={(l) => handleOpenEditListingModal(l)}
      currentUser={currentUser}
      isLoggedIn={isLoggedIn}
      currentLang={currentLang}
    />
  );
};
