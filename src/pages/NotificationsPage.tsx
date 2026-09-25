import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { NotificationsView } from '../components/NotificationsView';
import { ActiveView } from '../types';
import { LoginRequired } from '../components/LoginRequired';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    notifications,
    handleMarkAllNotificationsRead,
    handleDeleteNotification,
    handleMarkNotificationRead,
    handleClearAllNotifications,
    setActiveConversationId,
    currentLang,
    isLoggedIn,
    authReady,
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

  if (!authReady) return null;
  if (!isLoggedIn) return <LoginRequired />;

  return (
    <NotificationsView
      notifications={notifications}
      onMarkAllAsRead={handleMarkAllNotificationsRead}
      onMarkAsRead={handleMarkNotificationRead}
      onDeleteNotification={handleDeleteNotification}
      onClearAll={handleClearAllNotifications}
      onNavigateView={handleNavigateView}
      onBackToHome={() => navigate('/')}
      currentLang={currentLang}
    />
  );
};
