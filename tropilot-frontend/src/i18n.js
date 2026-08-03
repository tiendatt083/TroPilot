import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import vi from './locales/vi.json';

// Ưu tiên ngôn ngữ người dùng đã chọn; mặc định ứng dụng hiển thị tiếng Việt.
const savedLanguage = localStorage.getItem('lang') || 'vi';

/** Đồng bộ thuộc tính lang của HTML để trình duyệt và công cụ hỗ trợ đọc đúng ngôn ngữ. */
function applyDocumentLanguage(language) {
  document.documentElement.lang = language?.startsWith('en') ? 'en-GB' : 'vi-VN';
}

// Khởi tạo i18next với hai bộ nội dung Anh/Việt và cho phép React sử dụng hook dịch.
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

// Cập nhật ngôn ngữ tài liệu ngay lần đầu và mỗi khi người dùng đổi ngôn ngữ.
i18n.on('languageChanged', applyDocumentLanguage);
applyDocumentLanguage(i18n.resolvedLanguage || i18n.language || savedLanguage);

export default i18n;
