import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

// Sitenin alt bilgi alanı: gizlilik ve çerez politikasına, tarayıcı verilerine bağlantılar.
export const Footer: React.FC = () => {
  const { t } = useApp();

  return (
    <footer className="border-t border-stone-200 bg-white/60 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 pb-28 sm:pb-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
        <span>© {new Date().getFullYear()} Padova Student Housing</span>
        <nav aria-label="footer" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-semibold">
          <Link to="/gizlilik" className="hover:text-orange-700 transition">
            {t.footerPrivacy}
          </Link>
          <Link to="/gizlilik#tarayici-verileri" className="hover:text-orange-700 transition">
            {t.footerLocalData}
          </Link>
        </nav>
      </div>
    </footer>
  );
};
