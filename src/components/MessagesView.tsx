import React, { useState, useEffect, useRef } from 'react';
import { ConversationContact, Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { 
  MessageSquare, 
  Send, 
  Search, 
  ArrowLeft,
  Clock,
  ChevronLeft,
  Globe
} from 'lucide-react';
import { formatDeviceTime, formatDeviceRelativeDate } from '../utils/deviceTime';
import { ChatMessageItem } from './ChatMessageItem';
import { ScamSafetyBanner } from './ScamSafetyBanner';

interface MessagesViewProps {
  conversations: ConversationContact[];
  activeConversationId: string;
  onSelectConversation: (id: string) => void;
  onSendMessage: (conversationId: string, text: string) => void;
  onBackToHome: () => void;
  currentLang: Language;
}

export const MessagesView: React.FC<MessagesViewProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onSendMessage,
  onBackToHome,
  currentLang,
}) => {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.it;
  const [inputText, setInputText] = useState('');
  const [searchContact, setSearchContact] = useState('');
  // On mobile: toggle between contacts list and conversation screen
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [autoTranslate, setAutoTranslate] = useState(false);

  // Live device local time and region info
  const [currentDeviceTime, setCurrentDeviceTime] = useState(() => formatDeviceTime());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDeviceTime(formatDeviceTime());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const activeContact = conversations.find((c) => c.id === activeConversationId) || conversations[0];
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeContact?.messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeContact) return;
    onSendMessage(activeContact.id, inputText.trim());
    setInputText('');
  };

  const handleQuickQuestion = (question: string) => {
    if (!activeContact) return;
    onSendMessage(activeContact.id, question);
  };

  const filteredConversations = conversations.filter(
    (c) =>
      c.name.toLowerCase().includes(searchContact.toLowerCase()) ||
      c.username.toLowerCase().includes(searchContact.toLowerCase()) ||
      c.subject.toLowerCase().includes(searchContact.toLowerCase())
  );

  return (
    <div className="w-full space-y-4 pb-20 sm:pb-8">
      {/* Top Banner with Generous Air */}
      <div className="p-4 sm:p-5 bg-white flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBackToHome}
            className="border border-stone-200 bg-white hover:bg-stone-50 min-h-[42px] px-3.5 py-2 text-xs font-semibold flex items-center gap-2 rounded-xl shadow-xs transition cursor-pointer active:translate-y-0.5 text-stone-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.homeNav}</span>
          </button>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-stone-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-700" />
              <span>{t.inboxTitle} ({conversations.length} {t.contactsLabel})</span>
            </h2>
            <p className="text-xs text-stone-500">
              {t.inboxSubtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Main Multi-Conversation Layout (Responsive Mobile Thumb Split) */}
      <div className="bg-white overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[580px] rounded-2xl border border-stone-200 shadow-sm">
        
        {/* Left Contact List (4 Cols on desktop, full screen on mobile when mobileView === 'list') */}
        <div className={`md:col-span-4 border-r border-stone-200 flex flex-col bg-stone-50/40 ${
          mobileView === 'chat' ? 'hidden md:flex' : 'flex'
        }`}>
          
          {/* Search Contacts (Min 44px touch target) */}
          <div className="p-3.5 border-b border-stone-200 bg-white">
            <div className="relative">
              <input
                type="text"
                value={searchContact}
                onChange={(e) => setSearchContact(e.target.value)}
                placeholder={t.searchContactsPlaceholder}
                className="w-full min-h-[42px] border border-stone-200 p-2.5 text-xs bg-stone-50 rounded-xl outline-none pl-9 focus:bg-white focus:border-stone-400 text-stone-900 transition-colors"
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Conversations List with Generous Tap Targets */}
          <div className="flex-1 overflow-y-auto divide-y divide-stone-100">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-stone-400 space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-stone-600">
                  {searchContact 
                    ? t.noContactsFound 
                    : t.noMessagesYet}
                </p>
                <p className="text-[11px] text-stone-400 max-w-[220px] mx-auto leading-relaxed">
                  {t.startChatFromListing}
                </p>
              </div>
            ) : (
              filteredConversations.map((contact) => {
                const isActive = contact.id === activeContact?.id;
                const lastMsg = contact.messages[contact.messages.length - 1];
                const displayLastTime = lastMsg?.timestamp
                  ? formatDeviceRelativeDate(lastMsg.timestamp, currentLang)
                  : (contact.lastMessageTime || '');

                return (
                  <div
                    key={contact.id}
                    onClick={() => {
                      onSelectConversation(contact.id);
                      setMobileView('chat');
                    }}
                    className={`p-3.5 cursor-pointer transition select-none flex items-start gap-3 min-h-[64px] active:bg-orange-50 ${
                      isActive ? 'bg-orange-50/80 border-l-4 border-l-orange-600' : 'hover:bg-stone-100/50'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={contact.avatar}
                        alt={contact.name}
                        className="w-11 h-11 rounded-xl border border-stone-200 object-cover shadow-xs"
                      />
                      {contact.online && (
                        <span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white absolute -bottom-0.5 -right-0.5"></span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-semibold text-xs text-stone-900 truncate">
                          {contact.name}
                        </span>
                        <span className="text-[10px] text-stone-400 shrink-0">
                          {displayLastTime}
                        </span>
                      </div>

                      <div className="text-[10px] text-orange-700 font-medium truncate block">
                        @{contact.username} • {contact.department}
                      </div>

                      <p className="text-[11px] text-stone-500 truncate mt-1">
                        {lastMsg ? lastMsg.text : contact.subject}
                      </p>
                    </div>

                    {contact.unreadCount > 0 && (
                      <span className="bg-rose-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold self-center shadow-xs">
                        {contact.unreadCount}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Active Conversation Screen (8 Cols on desktop, full screen on mobile when mobileView === 'chat') */}
        <div className={`md:col-span-8 flex flex-col bg-stone-50/30 ${
          mobileView === 'list' ? 'hidden md:flex' : 'flex'
        }`}>
          {activeContact ? (
            <>
              {/* Chat Header with Mobile Back Button */}
              <div className="p-3.5 bg-white border-b border-stone-200 flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2.5">
                  
                  {/* Mobile Return to Contacts Button (Min 44px) */}
                  <button
                    type="button"
                    onClick={() => setMobileView('list')}
                    className="md:hidden w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center border border-stone-200 rounded-xl bg-stone-50 active:bg-stone-100 cursor-pointer"
                    title={t.backToContacts}
                  >
                    <ChevronLeft className="w-5 h-5 text-stone-700" />
                  </button>

                  <img
                    src={activeContact.avatar}
                    alt={activeContact.name}
                    className="w-10 h-10 rounded-xl border border-stone-200 object-cover shadow-xs"
                  />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-xs sm:text-sm text-stone-900">
                        {activeContact.name} (@{activeContact.username})
                      </h3>
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9px] font-semibold px-1.5 py-0.5 rounded-full">
                        {t.verifiedUniPDBadge}
                      </span>
                    </div>
                    <div className="text-[10px] text-stone-500 truncate max-w-[200px] sm:max-w-md">
                      {activeContact.subject}
                    </div>
                  </div>
                </div>

                {/* Auto Translate Toggle & Device Local Time Indicator */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAutoTranslate(!autoTranslate)}
                    className={`min-h-[38px] px-2.5 sm:px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer select-none border ${
                      autoTranslate
                        ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                        : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                    }`}
                    title={t.autoTranslateDesc}
                  >
                    <Globe className={`w-3.5 h-3.5 ${autoTranslate ? 'text-white' : 'text-orange-600'}`} />
                    <span className="hidden xs:inline">{t.autoTranslateTitle}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                      autoTranslate ? 'bg-orange-700 text-white' : 'bg-stone-200 text-stone-700'
                    }`}>
                      {currentLang}
                    </span>
                  </button>

                  <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-stone-500 bg-stone-100 px-2.5 py-1.5 border border-stone-200 rounded-xl" title={t.deviceLocalTime}>
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    <span>{currentDeviceTime}</span>
                  </div>
                </div>
              </div>

              <ScamSafetyBanner currentLang={currentLang} />

              {/* Chat Message Stream with In-Line Translation */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                {activeContact.messages.map((msg) => (
                  <ChatMessageItem
                    key={msg.id}
                    message={msg}
                    senderUsername={activeContact.username}
                    currentLang={currentLang}
                    autoTranslate={autoTranslate}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Template Prompts with Thumb Tap Targets */}
              <div className="px-3.5 py-2 bg-stone-100 border-t border-stone-200 flex items-center gap-2 overflow-x-auto text-[11px] font-medium no-scrollbar">
                <span className="text-stone-400 shrink-0">{t.quickLabel}</span>
                <button
                  type="button"
                  onClick={() => handleQuickQuestion(t.quickPromptVideo)}
                  className="min-h-[36px] bg-white hover:bg-orange-50 hover:text-orange-700 px-3 py-1 border border-stone-200 rounded-xl shrink-0 transition active:scale-95 cursor-pointer shadow-xs text-stone-700"
                >
                  {t.quickPromptVideo}
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickQuestion(t.quickPromptContract)}
                  className="min-h-[36px] bg-white hover:bg-orange-50 hover:text-orange-700 px-3 py-1 border border-stone-200 rounded-xl shrink-0 transition active:scale-95 cursor-pointer shadow-xs text-stone-700"
                >
                  {t.quickPromptContract}
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickQuestion(t.quickPromptBills)}
                  className="min-h-[36px] bg-white hover:bg-orange-50 hover:text-orange-700 px-3 py-1 border border-stone-200 rounded-xl shrink-0 transition active:scale-95 cursor-pointer shadow-xs text-stone-700"
                >
                  {t.quickPromptBills}
                </button>
              </div>

              {/* Thumb-First Ergonomic Message Input Form */}
              <form onSubmit={handleSend} className="p-3.5 bg-white border-t border-stone-200 flex gap-2.5 items-center">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`${t.writeMessageToUser} @${activeContact.username}...`}
                  className="flex-1 min-h-[46px] border border-stone-200 px-3.5 py-2 text-base sm:text-xs rounded-xl outline-none bg-stone-50/50 focus:bg-white focus:border-stone-400 text-stone-900 transition-colors"
                />
                <button
                  type="submit"
                  className="min-h-[46px] px-4 sm:px-5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:translate-y-0.5 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">{t.sendBtn}</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-stone-400 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-xs">
                <p className="text-xs font-semibold text-stone-700">
                  {t.selectOrStartChat}
                </p>
                <p className="text-[11px] text-stone-400 leading-relaxed">
                  {t.selectOrStartChatHint}
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
