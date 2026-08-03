import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState
} from 'react';

// Context quản lý lựa chọn giao diện sáng/tối dùng chung cho toàn bộ ứng dụng.
const ThemeContext = createContext(null);
const THEME_STORAGE_KEY = 'theme';
const SYSTEM_DARK_MODE_QUERY = '(prefers-color-scheme: dark)';
const SUPPORTED_THEMES = new Set(['light', 'dark', 'system']);

/** Đọc lựa chọn theme đã lưu; dùng system nếu localStorage không có hoặc giá trị không hợp lệ. */
function getStoredTheme() {
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  return SUPPORTED_THEMES.has(storedTheme) ? storedTheme : 'system';
}

/** Xác định theme hiện tại theo cài đặt hệ điều hành/trình duyệt. */
function getSystemTheme() {
  return window.matchMedia(SYSTEM_DARK_MODE_QUERY).matches ? 'dark' : 'light';
}

/**
 * Cung cấp theme cho ứng dụng, lắng nghe thay đổi dark mode của hệ thống và áp dụng theme vào thẻ HTML.
 */
export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getStoredTheme);
  const [systemTheme, setSystemTheme] = useState(getSystemTheme);
  const resolvedTheme = theme === 'system' ? systemTheme : theme;

  // Cập nhật giao diện ngay khi người dùng thay đổi dark mode của hệ điều hành ở chế độ system.
  useEffect(() => {
    const mediaQuery = window.matchMedia(SYSTEM_DARK_MODE_QUERY);
    const handleSystemThemeChange = (event) => {
      setSystemTheme(event.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, []);

  // Đặt data-theme và color-scheme trước khi trình duyệt vẽ để tránh chớp sai màu.
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  /** Lưu lựa chọn theme hợp lệ và cập nhật state. */
  const setTheme = useCallback((nextTheme) => {
    if (!SUPPORTED_THEMES.has(nextTheme)) {
      return;
    }

    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    setThemeState(nextTheme);
  }, []);

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme
    }),
    [resolvedTheme, setTheme, theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** Hook lấy theme hiện tại và hàm đổi theme từ ThemeProvider. */
export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return context;
}
