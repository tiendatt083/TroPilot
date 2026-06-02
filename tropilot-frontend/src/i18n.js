import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import vi from './locales/vi.json';

const savedLanguage = localStorage.getItem('lang') || 'vi';

function applyDocumentLanguage(language) {
  document.documentElement.lang = language?.startsWith('en') ? 'en-GB' : 'vi-VN';
}

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: en
    },
    vi: {
      translation: vi
    }
  },
  lng: savedLanguage,
  fallbackLng: 'vi',
  interpolation: {
    escapeValue: false
  }
});

i18n.on('languageChanged', applyDocumentLanguage);
applyDocumentLanguage(i18n.resolvedLanguage || i18n.language || savedLanguage);

export default i18n;
