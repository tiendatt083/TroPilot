import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const savedLanguage = localStorage.getItem('lang') || 'vi';

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: {
        settings: 'Settings',
        language: 'Language',
        vietnamese: 'Vietnamese',
        english: 'English'
      }
    },
    vi: {
      translation: {
        settings: 'Cài đặt',
        language: 'Ngôn ngữ',
        vietnamese: 'Tiếng Việt',
        english: 'Tiếng Anh'
      }
    }
  },
  lng: savedLanguage,
  fallbackLng: 'vi',
  interpolation: {
    escapeValue: false
  }
});

export default i18n;
