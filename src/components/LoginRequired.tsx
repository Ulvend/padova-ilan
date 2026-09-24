import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface LoginRequiredProps {
  title?: string;
  body?: string;
  icon?: React.ReactNode;
}

// Giriş gerektiren sayfalarda oturum yokken gösterilen ortak kapı.
export const LoginRequired: React.FC<LoginRequiredProps> = ({ title, body, icon }) => {
  const navigate = useNavigate();
  const { t, handleOpenAuthModal } = useApp();

  return (
    <div className="max-w-xl mx-auto py-12 px-6 text-center bg-white rounded-2xl border border-stone-200 shadow-sm space-y-4">
      <div className="w-16 h-16 bg-amber-50 border border-amber-200 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
        {icon ?? <LogIn className="w-8 h-8" />}
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-stone-900">{title ?? t.loginRequiredTitle}</h2>
        <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed">{body ?? t.loginRequiredBody}</p>
      </div>
      <div className="flex items-center justify-center gap-3 pt-3 flex-wrap">
        <button
          type="button"
          onClick={() => handleOpenAuthModal('login', 'default')}
          className="bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs transition cursor-pointer min-h-[42px]"
        >
          {t.loginNav}
        </button>
        <button
          type="button"
          onClick={() => handleOpenAuthModal('register', 'default')}
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
};
