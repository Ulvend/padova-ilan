import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { MessagesView } from '../components/MessagesView';
import { MessageSquare } from 'lucide-react';

export const MessagesPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    isLoggedIn,
    conversations,
    activeConversationId,
    setActiveConversationId,
    handleSendMessage,
    currentLang,
    t,
    handleOpenAuthModal,
  } = useApp();

  if (!isLoggedIn) {
    return (
      <div className="max-w-xl mx-auto py-12 px-6 text-center bg-white rounded-2xl border border-stone-200 shadow-sm space-y-4">
        <div className="w-16 h-16 bg-amber-50 border border-amber-200 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
          <MessageSquare className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-stone-900">
            {currentLang === 'tr' ? 'Mesajlaşmak İçin Giriş Yapmalısınız' :
             currentLang === 'it' ? 'Accesso Richiesto per Messaggiare' :
             'Login Required to Message'}
          </h2>
          <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed">
            {currentLang === 'tr' 
              ? 'Padova Güvenli Öğrenci Ağı kuralı gereğince, ilan sahipleri ve potansiyel ev arkadaşlarıyla mesajlaşabilmek için onaylı bir hesaba ve profile sahip olmanız gerekmektedir.' 
              : 'According to the Padova Safe Student Network rules, messaging listing owners and roommates requires an active profile and verified account.'}
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-3 flex-wrap">
          <button
            type="button"
            onClick={() => handleOpenAuthModal('login', 'chat')}
            className="bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs transition cursor-pointer min-h-[42px]"
          >
            {t.loginNav}
          </button>
          <button
            type="button"
            onClick={() => handleOpenAuthModal('register', 'chat')}
            className="bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold px-5 py-2.5 rounded-xl transition cursor-pointer min-h-[42px]"
          >
            {t.registerNav}
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-stone-500 hover:text-stone-800 text-xs font-medium px-3 py-2.5 transition cursor-pointer min-h-[42px]"
          >
            {t.backToHome}
          </button>
        </div>
      </div>
    );
  }

  return (
    <MessagesView
      conversations={conversations}
      activeConversationId={activeConversationId}
      onSelectConversation={setActiveConversationId}
      onSendMessage={handleSendMessage}
      onBackToHome={() => navigate('/')}
      currentLang={currentLang}
    />
  );
};
