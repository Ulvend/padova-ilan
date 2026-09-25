import React, { useEffect, useState } from 'react';
import { formatDeviceRelativeDate } from '../utils/deviceTime';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  ArrowLeft, 
  MessageSquare, 
  Building2, 
  ShieldCheck, 
  ShieldAlert, 
  Sparkles, 
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { ActiveView, Language, UserNotification, NotificationType } from '../types';
import { TRANSLATIONS } from '../utils/translations';

interface NotificationsViewProps {
  notifications: UserNotification[];
  onMarkAllAsRead: () => void;
  onMarkAsRead: (id: string) => void;
  onDeleteNotification: (id: string) => void;
  onClearAll: () => void;
  onNavigateView: (view: ActiveView, linkId?: string) => void;
  onBackToHome: () => void;
  currentLang?: Language;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  notifications,
  onMarkAllAsRead,
  onMarkAsRead,
  onDeleteNotification,
  onClearAll,
  onNavigateView,
  onBackToHome,
  currentLang = 'it',
}) => {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.it;
  const [filterType, setFilterType] = useState<'all' | NotificationType>('all');
  // Tümünü silmek geri alınamaz: ilk tıklama onay ister, 4 sn içinde ikinci tıklama siler.
  const [confirmClear, setConfirmClear] = useState(false);
  useEffect(() => {
    if (!confirmClear) return;
    const timer = setTimeout(() => setConfirmClear(false), 4000);
    return () => clearTimeout(timer);
  }, [confirmClear]);

  const handleClearClick = () => {
    if (!confirmClear) return setConfirmClear(true);
    setConfirmClear(false);
    onClearAll();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredNotifications = notifications.filter(item => {
    if (filterType === 'all') return true;
    return item.type === filterType;
  });

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="w-4 h-4 text-purple-600" />;
      case 'listing':
        return <Building2 className="w-4 h-4 text-orange-600" />;
      case 'security':
        return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
      case 'tenant':
        return <Sparkles className="w-4 h-4 text-amber-600" />;
      case 'admin':
        return <ShieldAlert className="w-4 h-4 text-blue-600" />;
      default:
        return <Bell className="w-4 h-4 text-stone-600" />;
    }
  };

  const getNotificationBadgeClass = (type: NotificationType) => {
    switch (type) {
      case 'message':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'listing':
        return 'bg-orange-50 text-orange-800 border-orange-200';
      case 'security':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'tenant':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'admin':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      default:
        return 'bg-stone-50 text-stone-700 border-stone-200';
    }
  };

  const getTypeLabel = (type: NotificationType) => {
    switch (type) {
      case 'message':
        return t.notifTypeMessage;
      case 'listing':
        return t.notifTypeListing;
      case 'security':
        return t.notifTypeSecurity;
      case 'tenant':
        return t.notifTypeTenant;
      case 'admin':
        return t.notifTypeAdmin;
      default:
        return t.notifTypeSystem;
    }
  };

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-200">
      {/* Header Card */}
      <div className="p-5 md:p-6 bg-white rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button 
            onClick={onBackToHome}
            className="text-xs font-semibold text-orange-600 hover:text-orange-700 mb-1.5 flex items-center gap-1 transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t.backToHome}</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-bold tracking-tight text-stone-900">
                  {t.notificationsNav}
                </h2>
                {unreadCount > 0 && (
                  <span className="bg-orange-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {unreadCount} {t.notifNewCount}
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                {t.notifSubtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={onMarkAllAsRead}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 transition cursor-pointer flex items-center gap-1.5"
            >
              <CheckCheck className="w-4 h-4 text-emerald-600" />
              <span>{t.markAllRead}</span>
            </button>
          )}

          {notifications.length > 0 && (
            <button
              type="button"
              onClick={handleClearClick}
              className={`px-3 py-2 text-xs font-semibold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                confirmClear ? 'bg-rose-600 text-white hover:bg-rose-700' : 'text-stone-500 hover:text-rose-600 hover:bg-rose-50'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span aria-live="polite">{confirmClear ? t.clearAllConfirm : t.clearAll}</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setFilterType('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer border ${
            filterType === 'all'
              ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
              : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
          }`}
        >
          {t.notifFilterAll} ({notifications.length})
        </button>

        <button
          type="button"
          onClick={() => setFilterType('listing')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer border flex items-center gap-1.5 ${
            filterType === 'listing'
              ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
              : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>{t.notifFilterListings}</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterType('message')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer border flex items-center gap-1.5 ${
            filterType === 'message'
              ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
              : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>{t.notifFilterMessages}</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterType('security')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer border flex items-center gap-1.5 ${
            filterType === 'security'
              ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
              : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>UniPD SSO</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterType('admin')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer border flex items-center gap-1.5 ${
            filterType === 'admin'
              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
              : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Admin</span>
        </button>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
            <CheckCircle2 className="w-7 h-7 text-emerald-500" />
          </div>
          <h3 className="font-bold text-base text-stone-900">
            {t.noNotifTitle}
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            {t.noNotifBody}
          </p>
          <button
            type="button"
            onClick={onBackToHome}
            className="bg-stone-900 hover:bg-stone-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            {t.backToHome}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => onMarkAsRead(notif.id)}
              className={`p-4 md:p-5 rounded-2xl border transition shadow-xs flex items-start justify-between gap-4 cursor-pointer ${
                notif.read
                  ? 'bg-white border-stone-200 hover:border-stone-300'
                  : 'bg-orange-50/30 border-orange-200 hover:bg-orange-50/50'
              }`}
            >
              <div className="flex items-start gap-3.5 flex-1 min-w-0">
                <div className="p-2.5 rounded-xl bg-stone-100 border border-stone-200 shrink-0 mt-0.5">
                  {getNotificationIcon(notif.type)}
                </div>

                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getNotificationBadgeClass(notif.type)}`}>
                      {getTypeLabel(notif.type)}
                    </span>
                    <span className="text-[11px] text-stone-400 font-medium">
                      {notif.timestamp ? formatDeviceRelativeDate(notif.timestamp, currentLang) : notif.createdAt}
                    </span>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-orange-600 animate-pulse"></span>
                    )}
                  </div>

                  <h4 className="font-bold text-sm text-stone-900">
                    {notif.title}
                  </h4>

                  <p className="text-xs text-stone-600 leading-relaxed">
                    {notif.message}
                  </p>

                  {/* Navigation jump link if present */}
                  {notif.linkView && (
                    <div className="pt-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkAsRead(notif.id);
                          onNavigateView(notif.linkView!, notif.linkId);
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline cursor-pointer"
                      >
                        <span>
                          {notif.linkView === 'messages' ? t.notifOpenMessage :
                           notif.linkView === 'myListings' ? t.notifGoMyListings :
                           notif.linkView === 'profile' ? t.notifOpenProfile :
                           notif.linkView === 'admin' ? t.notifOpenAdmin :
                           notif.linkView === 'listingDetail' ? t.notifOpenListing :
                           t.notifViewDetails}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Delete button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteNotification(notif.id);
                }}
                className="text-stone-400 hover:text-rose-600 hover:bg-rose-50 p-2 rounded-lg transition cursor-pointer shrink-0"
                title={t.notifDelete}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
