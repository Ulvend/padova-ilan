import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {loadLanguage} from './utils/translations';
import type {Language} from './types';

const LANGUAGES: Language[] = ['tr', 'en', 'it', 'de', 'ru', 'hi'];

const savedLanguage = (): Language => {
  try {
    const saved = localStorage.getItem('padova_housing_lang') as Language | null;
    return saved && LANGUAGES.includes(saved) ? saved : 'tr';
  } catch {
    return 'tr';
  }
};

// Kayıtlı dilin sözlüğü indirilmeden ilk çizim yapılmaz (Türkçe metnin bir an görünüp değişmesini önler).
// İndirme başarısız olursa uygulama yine açılır; metinler Türkçe kalır.
loadLanguage(savedLanguage())
  .catch((error) => console.warn('Language pack could not be loaded:', error))
  .finally(() => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  });
