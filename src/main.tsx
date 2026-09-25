import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {loadLanguage} from './utils/translations';
import type {Language} from './types';

const LANGUAGES: Language[] = ['it', 'tr', 'en', 'de', 'ru', 'hi'];

const savedLanguage = (): Language => {
  try {
    const saved = localStorage.getItem('padova_housing_lang') as Language | null;
    return saved && LANGUAGES.includes(saved) ? saved : 'it';
  } catch {
    return 'it';
  }
};

// Kayıtlı dilin sözlüğü indirilmeden ilk çizim yapılmaz (İtalyanca metnin bir an görünüp değişmesini önler).
// İndirme başarısız olursa uygulama yine açılır; metinler İtalyanca kalır.
loadLanguage(savedLanguage())
  .catch((error) => console.warn('Language pack could not be loaded:', error))
  .finally(() => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  });
