import React, { useState, useEffect, useRef } from 'react';
import { Send, AlertTriangle, MessageSquare, Users, ChevronDown, Clock, Globe } from 'lucide-react';
import { ConversationContact, Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { formatDeviceTime, formatDeviceRelativeDate, getDeviceRegionInfo } from '../utils/deviceTime';
import { ChatMessageItem } from './ChatMessageItem';

interface ChatWidgetProps {
  conversations: ConversationContact[];
  activeConversationId: string;
  onSelectConversation: (id: string) => void;
  onSendMessage: (conversationId: string, text: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  currentLang: Language;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onSendMessage,
  isOpen,
  onToggle,
  currentLang,
}) => {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.tr;
  const [inputText, setInputText] = useState('');
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [autoTranslate, setAutoTranslate] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Live device local time and region info
  const [currentDeviceTime, setCurrentDeviceTime] = useState(() => formatDeviceTime());
  const deviceInfo = useRef(getDeviceRegionInfo()).current;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDeviceTime(formatDeviceTime());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const activeContact = conversations.find((c) => c.id === activeConversationId) || conversations[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeContact?.messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || !activeContact) return;
    onSendMessage(activeContact.id, text);
    setInputText('');
  };

  const totalUnread = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

  return (
    <div 
      id="chatWidget"
      className="fixed bottom-20 right-3 sm:bottom-4 sm:right-4 w-[calc(100vw-24px)] max-w-sm sm:w-96 bg-white z-40 overflow-hidden shadow-2xl flex flex-col rounded-2xl border border-stone-200"
    >
      {/* Header Bar */}
      <div 
        className="bg-stone-900 text-white p-3.5 flex items-center justify-between cursor-pointer select-none"
      >
        <div 
          onClick={onToggle}
          className="flex items-center gap-2 flex-1 min-w-0"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
          <span className="font-semibold text-xs tracking-tight truncate">
            {t.messagesNav}: {activeContact ? `@${activeContact.username}` : t.messagesNav}
          </span>
          {totalUnread > 0 && (
            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold shrink-0">
              {totalUnread}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isOpen && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowContactPicker(!showContactPicker);
              }}
              className="text-[11px] bg-stone-800 hover:bg-stone-700 px-2.5 py-1 rounded-lg border border-stone-700 flex items-center gap-1.5 text-stone-200 font-medium transition cursor-pointer"
              title={t.switchContact}
            >
              <Users className="w-3 h-3" />
              <span>{t.contactsLabel} ({conversations.length})</span>
            </button>
          )}

          <span 
            onClick={onToggle}
            className="hover:text-orange-400 font-bold text-xs px-1 cursor-pointer"
          >
            {isOpen ? '▼' : '▲'}
          </span>
        </div>
      </div>

      {/* Body */}
      {isOpen && (
        <div className="flex flex-col h-80 bg-stone-50/50">
          
          {/* Quick Contact Picker Bar if opened */}
          {showContactPicker ? (
            <div className="flex-1 overflow-y-auto divide-y divide-stone-100 bg-white p-2 space-y-1">
              <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide block mb-1 px-1">
                {t.selectStudentToChat}
              </span>
              {conversations.map((c) => {
                const lastMsg = c.messages[c.messages.length - 1];
                const displayLastTime = lastMsg?.timestamp
                  ? formatDeviceRelativeDate(lastMsg.timestamp, currentLang)
                  : (c.lastMessageTime || '');

                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      onSelectConversation(c.id);
                      setShowContactPicker(false);
                    }}
                    className={`p-2.5 rounded-xl flex items-center gap-2.5 cursor-pointer hover:bg-orange-50 border border-transparent text-xs transition ${
                      c.id === activeContact?.id ? 'bg-orange-50/80 border-orange-200 font-semibold' : ''
                    }`}
                  >
                    <img src={c.avatar} alt="" className="w-8 h-8 rounded-full border border-stone-200 object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs truncate text-stone-900">{c.name} (@{c.username})</span>
                        <span className="text-[10px] text-stone-400">{displayLastTime}</span>
                      </div>
                      <div className="text-[10px] text-stone-500 truncate">{c.subject}</div>
                    </div>
                    {c.unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : !activeContact ? (
            <div className="p-8 text-center text-stone-400 space-y-2 flex-1 flex flex-col items-center justify-center min-h-[220px]">
              <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                <MessageSquare className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-stone-700">
                {t.noActiveChats}
              </p>
              <p className="text-[11px] text-stone-400 max-w-[200px] leading-relaxed">
                {t.chatWidgetHint}
              </p>
            </div>
          ) : (
            <>
              {/* Security Notice, Auto-Translate Toggle & Device Local Clock Badge */}
              <div className="p-2 border-b border-stone-200 bg-amber-50/70 text-[11px] text-stone-700 leading-tight flex items-center justify-between gap-1.5 flex-wrap">
                <div className="flex items-center gap-1 truncate max-w-[150px] xs:max-w-none">
                  <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                  <span className="truncate text-[10px]">
                    <strong className="text-stone-900">{t.safeNotice}</strong> {t.fraudWarning.slice(0, 32)}...
                  </span>
                </div>
                
                <div className="flex items-center gap-1 ml-auto">
                  <button
                    type="button"
                    onClick={() => setAutoTranslate(!autoTranslate)}
                    className={`min-h-[28px] px-2 py-0.5 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition cursor-pointer select-none border ${
                      autoTranslate
                        ? 'bg-orange-600 text-white border-orange-600'
                        : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-200'
                    }`}
                    title={t.autoTranslateDesc}
                  >
                    <Globe className="w-3 h-3 text-orange-500" />
                    <span>{t.translatedBadge}</span>
                    <span className={`px-1 rounded text-[9px] ${autoTranslate ? 'bg-orange-700 text-white' : 'bg-stone-100'}`}>
                      {currentLang.toUpperCase()}
                    </span>
                  </button>

                  <div
                    className="flex items-center gap-1 text-[10px] text-stone-600 bg-white border border-stone-200 px-1.5 py-0.5 rounded-md shrink-0 shadow-xs"
                    title={`${t.deviceLocalTime}: ${currentDeviceTime} (${deviceInfo.label})`}
                  >
                    <Clock className="w-2.5 h-2.5 text-orange-600" />
                    <span className="font-semibold">{currentDeviceTime}</span>
                  </div>
                </div>
              </div>

              {/* Messages container with Per-Message Translation */}
              <div className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs">
                {activeContact?.messages.map((msg) => (
                  <ChatMessageItem
                    key={msg.id}
                    compact
                    message={msg}
                    senderUsername={activeContact.username}
                    currentLang={currentLang}
                    autoTranslate={autoTranslate}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Form input */}
              <form onSubmit={handleSendMessage} className="p-2.5 border-t border-stone-200 flex gap-2 bg-white">
                <input 
                  id="chatInput"
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={t.writeMessage} 
                  className="flex-1 min-h-[44px] border border-stone-200 px-3 py-2 text-xs rounded-xl outline-none bg-stone-50/50 focus:bg-white focus:border-orange-500 transition shadow-xs"
                />
                <button 
                  id="btn-chat-send"
                  type="submit" 
                  className="min-h-[44px] px-4 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs uppercase rounded-xl flex items-center justify-center cursor-pointer shadow-xs active:translate-y-0.5 transition"
                >
                  {t.sendBtn}
                </button>
              </form>
            </>
          )}

        </div>
      )}
    </div>
  );
};
