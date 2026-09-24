import React, { useEffect, useRef } from 'react';
import { AtSign, Check, AlertCircle, Loader2 } from 'lucide-react';
import type { FullDictionary } from '../utils/translations';
import { isValidUsername, normalizeUsername } from '../utils/username';
import { isUsernameAvailable } from '../services/supabaseService';

export type UsernameStatus = 'empty' | 'invalid' | 'unchanged' | 'checking' | 'available' | 'taken' | 'error';

interface UsernameFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onStatusChange: (status: UsernameStatus) => void;
  status: UsernameStatus;
  t: FullDictionary;
  // Kullanıcının mevcut adı: aynı değer "değişmedi" sayılır ve sunucuya sorulmaz.
  currentUsername?: string;
  required?: boolean;
}

const CHECK_DELAY_MS = 400;

// Kayıt formu ve profil ayarlarında ortak kullanılan, canlı kullanılabilirlik kontrollü kullanıcı adı alanı.
export const UsernameField: React.FC<UsernameFieldProps> = ({
  id,
  value,
  onChange,
  onStatusChange,
  status,
  t,
  currentUsername,
  required = false,
}) => {
  // Geç dönen eski yanıtlar yeni girişin durumunu ezmesin.
  const requestId = useRef(0);

  useEffect(() => {
    const username = normalizeUsername(value);
    const current = requestId.current + 1;
    requestId.current = current;

    if (!username) return onStatusChange('empty');
    if (currentUsername && username === currentUsername) return onStatusChange('unchanged');
    if (!isValidUsername(username)) return onStatusChange('invalid');

    onStatusChange('checking');
    const timer = setTimeout(async () => {
      try {
        const available = await isUsernameAvailable(username);
        if (requestId.current === current) onStatusChange(available ? 'available' : 'taken');
      } catch {
        if (requestId.current === current) onStatusChange('error');
      }
    }, CHECK_DELAY_MS);
    return () => clearTimeout(timer);
    // onStatusChange kararlı olmak zorunda değil; yalnızca girdi değişince kontrol edilir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, currentUsername]);

  const message =
    status === 'invalid' ? t.usernameInvalid
    : status === 'taken' ? t.usernameTaken
    : status === 'available' ? t.usernameAvailable
    : status === 'checking' ? t.usernameChecking
    : status === 'error' ? t.usernameCheckFail
    : '';
  const tone =
    status === 'available' ? 'text-emerald-700'
    : status === 'invalid' || status === 'taken' || status === 'error' ? 'text-rose-600'
    : 'text-stone-500';

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-xs font-semibold text-stone-700">
        {t.usernameLabel} {required && <span className="text-rose-500">*</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.toLowerCase().replace(/\s/g, ''))}
          maxLength={20}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required={required}
          aria-invalid={status === 'invalid' || status === 'taken'}
          aria-describedby={`${id}-hint`}
          className="w-full min-h-[42px] px-3.5 pl-10 text-xs sm:text-sm border border-stone-300 rounded-xl bg-white text-stone-900 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
        />
        <AtSign className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
      </div>
      <p id={`${id}-hint`} className="text-[11px] text-stone-400">{t.usernameHint}</p>
      {message && (
        <p role="status" className={`text-[11px] font-semibold flex items-center gap-1 ${tone}`}>
          {status === 'checking' ? <Loader2 className="w-3 h-3 animate-spin" /> : status === 'available' ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
          {message}
        </p>
      )}
    </div>
  );
};
