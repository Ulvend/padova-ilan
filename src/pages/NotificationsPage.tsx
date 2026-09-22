import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { NotificationsView } from '../components/NotificationsView';
import { ActiveView } from '../types';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    notifications,
    handleMarkAllNotificationsRead,
    handleDeleteNotification,
    setActiveConversationId,
    currentLang,
  } = useApp();

  const handleNavigateView = (view: ActiveView, linkId?: string) => {
    if (view === 'messages') {
      if (linkId) setActiveConversationId(linkId);
      navigate('/mesajlar');
    } else if (view === 'myListings') {
      navigate('/ilanlarim');
    } else if (view === 'profile') {
      navigate('/profil');
    } else if (view === 'admin') {
      navigate('/admin');
    } else {
      navigate('/');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <NotificationsView
      notifications={notifications}
      onMarkAllAsRead={handleMarkAllNotificationsRead}
      onMarkAsRead={(id) => {}}
      onDeleteNotification={handleDeleteNotification}
      onClearAll={() => {}}
      onNavigateView={handleNavigateView}
      onBackToHome={() => navigate('/')}
      currentLang={currentLang}
    />
  );
};
