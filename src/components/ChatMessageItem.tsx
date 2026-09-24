import React, { useState, useEffect } from 'react';
import { DirectMessage, Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { 
  translateText, 
  detectLanguage, 
  SUPPORTED_LANGUAGES, 
  LANGUAGE_NAMES,
  TRANSLATE_ACTION_LABELS
} from '../utils/translator';
import { Globe, RefreshCw, ChevronDown, Check, Undo2 } from 'lucide-react';
import { formatDeviceRelativeDate, formatDeviceTime } from '../utils/deviceTime';

interface ChatMessageItemProps {
  message: DirectMessage;
  senderUsername?: string;
  currentLang: Language;
  compact?: boolean;
  autoTranslate?: boolean;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  senderUsername,
  currentLang,
  compact = false,
  autoTranslate = false,
}) => {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.tr;
  const isUser = message.sender === 'user';
  const isSystem = message.sender === 'system';

  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [targetLang, setTargetLang] = useState<Language | null>(null);
  const [detectedSourceLang, setDetectedSourceLang] = useState<Language | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  // Formatted message time
  const messageTime = message.timestamp
    ? (compact ? formatDeviceTime(message.timestamp) : formatDeviceRelativeDate(message.timestamp, currentLang))
    : (message.time || formatDeviceTime());

  // Detect likely source language
  const initialDetected = detectLanguage(message.text);

  // Suggested default target language:
  // - If message is foreign relative to active UI language -> translate to active UI language
  // - If message is already in active UI language -> in Padova, translate to Italian (or Turkish if UI is Italian)
  const defaultTargetLang: Language = (initialDetected !== currentLang)
    ? currentLang
    : (currentLang === 'it' ? 'tr' : 'it');

  const activeTarget = targetLang || defaultTargetLang;
  const targetMeta = SUPPORTED_LANGUAGES.find((l) => l.code === activeTarget) || SUPPORTED_LANGUAGES[0];
  const detectedMeta = SUPPORTED_LANGUAGES.find((l) => l.code === (detectedSourceLang || initialDetected)) || SUPPORTED_LANGUAGES[0];

  // Auto-translate effect if enabled
  useEffect(() => {
    if (autoTranslate && !isSystem && !translatedText && initialDetected !== currentLang) {
      performTranslation(currentLang);
    }
  }, [autoTranslate, currentLang, message.text, initialDetected]);

  // Reset translation if underlying text changes
  useEffect(() => {
    setTranslatedText(null);
    setTargetLang(null);
    setDetectedSourceLang(null);
    setShowOriginal(false);
  }, [message.text]);

  const performTranslation = async (langToTranslateTo: Language) => {
    setIsTranslating(true);
    setShowLangMenu(false);

    try {
      const result = await translateText(message.text, langToTranslateTo, initialDetected);
      setTranslatedText(result.translatedText);
      setTargetLang(langToTranslateTo);
      setDetectedSourceLang(result.detectedSourceLang);
      setShowOriginal(false);
    } catch (err) {
      console.error('Translation error:', err);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleQuickTranslate = () => {
    if (translatedText) {
      // Toggle between original and translation
      setShowOriginal(!showOriginal);
    } else {
      performTranslation(defaultTargetLang);
    }
  };

  // System notice message (e.g. listing header info)
  if (isSystem) {
    return (
      <div className={`bg-amber-50/90 border border-amber-200 text-xs shadow-xs select-none ${
        compact ? 'p-2 rounded-xl text-[11px]' : 'p-3 rounded-xl max-w-[92%] mx-auto'
      }`}>
        <span className="text-[10px] text-amber-800 font-bold block mb-0.5 tracking-wider">
          {t.systemTag}
        </span>
        <p className="text-stone-700 leading-relaxed font-medium">{message.text}</p>
      </div>
    );
  }

  // Determine active text to display
  const displayText = (translatedText && !showOriginal) ? translatedText : message.text;
  const isCurrentlyShowingTranslation = !!translatedText && !showOriginal;

  // Action button label
  const primaryActionText = TRANSLATE_ACTION_LABELS[currentLang]?.[defaultTargetLang] 
    || `${targetMeta.name} (${t.translateBtn})`;

  return (
    <div className={`group relative flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
      
      {/* Message Bubble Card */}
      <div
        className={`relative max-w-[92%] sm:max-w-[85%] rounded-2xl shadow-xs transition-all ${
          isUser
            ? 'bg-stone-900 text-white rounded-tr-xs p-3 sm:p-3.5'
            : 'bg-white border border-stone-200 text-stone-900 rounded-tl-xs p-3 sm:p-3.5'
        } ${compact ? 'text-xs' : 'text-xs sm:text-sm'}`}
      >
        {/* Header with Sender Username & Device Timestamp */}
        <div className={`flex items-center justify-between text-[10px] mb-1.5 gap-2 select-none ${
          isUser ? 'text-stone-400' : 'text-stone-500'
        }`}>
          <span className="font-semibold truncate">
            {isUser ? t.youSender : `@${senderUsername || 'student'}`}
          </span>
          <span className="shrink-0">{messageTime}</span>
        </div>

        {/* Translation Banner when translation is active */}
        {isCurrentlyShowingTranslation && (
          <div className={`flex items-center justify-between gap-1.5 text-[10px] font-medium py-1 px-2 rounded-lg mb-2 border select-none transition ${
            isUser 
              ? 'bg-stone-800 border-stone-700 text-stone-200' 
              : 'bg-orange-50/90 border-orange-200 text-orange-950'
          }`}>
            <span className="flex items-center gap-1.5 truncate">
              <Globe className="w-3.5 h-3.5 text-orange-600 shrink-0" />
              <span className="font-medium">
                {detectedMeta.flag} {detectedMeta.name} → {targetMeta.flag} {targetMeta.name} <span className="opacity-80">({t.translatedBadge})</span>
              </span>
            </span>

            <button
              type="button"
              onClick={() => setShowOriginal(true)}
              className="inline-flex items-center gap-1 text-[10px] font-semibold hover:underline cursor-pointer shrink-0 ml-1 text-orange-700 dark:text-orange-400"
              title={t.backToOriginal}
            >
              <Undo2 className="w-3 h-3" />
              <span>{t.showOriginalBtn}</span>
            </button>
          </div>
        )}

        {/* Translation Banner when toggled back to original text */}
        {translatedText && showOriginal && (
          <div className={`flex items-center justify-between gap-1.5 text-[10px] font-medium py-1 px-2 rounded-lg mb-2 border select-none ${
            isUser 
              ? 'bg-stone-800/90 border-stone-700 text-stone-300' 
              : 'bg-stone-100 border-stone-200 text-stone-700'
          }`}>
            <span className="text-[10px] font-medium">{t.originalLanguage} ({detectedMeta.flag} {detectedMeta.name})</span>
            <button
              type="button"
              onClick={() => setShowOriginal(false)}
              className="text-orange-600 font-bold hover:underline cursor-pointer shrink-0 ml-1 text-[10px]"
            >
              {t.showTranslation} ({targetMeta.flag} {targetMeta.name})
            </button>
          </div>
        )}

        {/* Message Text Content */}
        <p className="leading-relaxed break-words whitespace-pre-wrap select-text">
          {displayText}
        </p>

        {/* Translation Action Toolbar */}
        <div className={`mt-2 pt-2 border-t flex flex-wrap items-center justify-between gap-1.5 text-[11px] ${
          isUser ? 'border-stone-800' : 'border-stone-100'
        }`}>
          
          {/* Main Action Button */}
          <div className="flex items-center flex-wrap gap-1">
            <button
              type="button"
              onClick={handleQuickTranslate}
              disabled={isTranslating}
              className={`min-h-[32px] px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5 transition active:scale-95 cursor-pointer select-none text-[11px] ${
                isUser
                  ? 'bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700'
                  : 'bg-stone-50 hover:bg-orange-50 text-stone-800 hover:text-orange-900 border border-stone-200'
              }`}
            >
              {isTranslating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-500" />
                  <span>{t.translatingText}</span>
                </>
              ) : translatedText ? (
                showOriginal ? (
                  <>
                    <Globe className="w-3.5 h-3.5 text-orange-600" />
                    <span>{t.translatedBadge}: {targetMeta.flag} {targetMeta.name}</span>
                  </>
                ) : (
                  <>
                    <Undo2 className="w-3.5 h-3.5 text-stone-400" />
                    <span>{t.showOriginalBtn}</span>
                  </>
                )
              ) : (
                <>
                  <span>{targetMeta.flag}</span>
                  <span>{primaryActionText}</span>
                </>
              )}
            </button>

            {/* Quick 1-Click Language Flags Strip */}
            <div className="flex items-center gap-0.5 pl-0.5">
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isCurrentActive = (targetLang || (isCurrentlyShowingTranslation ? targetMeta.code : null)) === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => performTranslation(lang.code)}
                    disabled={isTranslating}
                    title={`${t.translateToLang} ${lang.name}`}
                    className={`w-6 h-6 rounded flex items-center justify-center text-[12px] transition cursor-pointer select-none hover:scale-110 active:scale-95 ${
                      isCurrentActive
                        ? 'bg-orange-100 ring-1 ring-orange-500 font-bold'
                        : isUser ? 'hover:bg-stone-800 opacity-75 hover:opacity-100' : 'hover:bg-stone-100 opacity-75 hover:opacity-100'
                    }`}
                  >
                    {lang.flag}
                  </button>
                );
              })}
            </div>

            {/* Language Selector Dropdown Button for compact/full selection */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowLangMenu(!showLangMenu)}
                className={`min-h-[32px] px-1.5 py-1 rounded-lg flex items-center gap-0.5 transition cursor-pointer select-none text-[11px] border ${
                  isUser
                    ? 'bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border-stone-200'
                }`}
                title={t.selectLanguagePrompt}
              >
                <ChevronDown className={`w-3 h-3 transition-transform ${showLangMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Language Selection Popup Dropdown */}
              {showLangMenu && (
                <div className={`absolute bottom-full mb-1.5 z-30 w-48 bg-white border border-stone-200 rounded-xl shadow-xl p-1 text-xs space-y-0.5 select-none ${
                  isUser ? 'right-0' : 'left-0'
                }`}>
                  <div className="px-2.5 py-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider border-b border-stone-100 flex items-center justify-between">
                    <span>{t.selectLanguagePrompt}:</span>
                    <span className="text-[9px] text-stone-400">Padova AI</span>
                  </div>
                  {SUPPORTED_LANGUAGES.map((lang) => {
                    const isSelected = targetLang === lang.code;
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => performTranslation(lang.code)}
                        className={`w-full px-2.5 py-1.5 text-left rounded-lg text-xs font-medium flex items-center justify-between cursor-pointer transition ${
                          isSelected
                            ? 'bg-orange-50 text-orange-950 font-bold'
                            : 'hover:bg-stone-100 text-stone-800'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-sm">{lang.flag}</span>
                          <span>{lang.name}</span>
                          <span className="text-[10px] text-stone-400 font-normal">({lang.nativeName})</span>
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-orange-600" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Detected Source Language Tag */}
          <span 
            className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold tracking-wider select-none ${
              isUser 
                ? 'bg-stone-800 text-stone-400' 
                : 'bg-stone-100 text-stone-500'
            }`}
            title={`${t.detectedLanguage}: ${detectedMeta.name}`}
          >
            {detectedMeta.flag} {initialDetected.toUpperCase()}
          </span>
        </div>

      </div>

    </div>
  );
};
