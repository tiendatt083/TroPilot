import { useTranslation } from 'react-i18next';
import LineIcon from '../components/common/LineIcon.jsx';
import ManagementPageHero from '../components/common/ManagementPageHero.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

const LANGUAGE_STORAGE_KEY = 'lang';
const THEME_OPTIONS = ['light', 'dark', 'system'];
const THEME_ICONS = {
  light: 'sun',
  dark: 'moon',
  system: 'monitor'
};

function normalizeLanguage(language) {
  return language?.startsWith('en') ? 'en' : 'vi';
}

/** Trang cài đặt giao diện như ngôn ngữ và chế độ sáng/tối. */
export default function Settings() {
  const { t, i18n } = useTranslation();
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const currentLanguage = normalizeLanguage(i18n.language);

  const handleLanguageChange = (language) => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    i18n.changeLanguage(language);
  };

  const renderOptionIcon = (iconName) => <LineIcon className="settings-option-icon" name={iconName} />;

  return (
    <section className="content-section management-page settings-page">
      <ManagementPageHero
        title={t('settings.title')}
        description={t('settings.description')}
      />

      <section className="settings-panel">
        <div className="settings-group">
          <span className="settings-group-icon">
            <LineIcon name="globe" />
          </span>
          <div className="settings-language-summary">
            <span>{t('settings.language')}</span>
            <strong>{currentLanguage === 'vi' ? t('settings.vietnamese') : t('settings.english')}</strong>
          </div>

          <div className="settings-language-actions">
            <button
              aria-label={t('settings.vietnamese')}
              aria-pressed={currentLanguage === 'vi'}
              className={currentLanguage === 'vi' ? 'inline-button' : 'secondary-button inline-button'}
              title={t('settings.vietnamese')}
              type="button"
              onClick={() => handleLanguageChange('vi')}
            >
              {renderOptionIcon('globe')}
              <span>VN</span>
            </button>
            <button
              aria-label={t('settings.english')}
              aria-pressed={currentLanguage === 'en'}
              className={currentLanguage === 'en' ? 'inline-button' : 'secondary-button inline-button'}
              title={t('settings.english')}
              type="button"
              onClick={() => handleLanguageChange('en')}
            >
              {renderOptionIcon('globe')}
              <span>EN</span>
            </button>
          </div>
        </div>

        <div className="settings-divider" />

        <div className="settings-group">
          <span className="settings-group-icon">
            <LineIcon name="palette" />
          </span>
          <div className="settings-language-summary">
            <span>{t('settings.appearance')}</span>
            <strong>{t(`settings.themes.${theme}`)}</strong>
          </div>

          <div className="settings-language-actions">
            {THEME_OPTIONS.map((themeOption) => (
              <button
                key={themeOption}
                aria-label={t(`settings.themes.${themeOption}`)}
                aria-pressed={theme === themeOption}
                className={theme === themeOption ? 'inline-button settings-icon-button' : 'secondary-button inline-button settings-icon-button'}
                title={t(`settings.themes.${themeOption}`)}
                type="button"
                onClick={() => setTheme(themeOption)}
              >
                {renderOptionIcon(THEME_ICONS[themeOption])}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-divider" />

        <div className="settings-group">
          <span className="settings-group-icon settings-group-icon-danger">
            <LineIcon name="logOut" />
          </span>
          <div className="settings-language-summary">
            <span>{t('settings.account')}</span>
            <strong>{t('common.signOut')}</strong>
          </div>
          <div className="settings-language-actions">
            <button
              aria-label={t('common.signOut')}
              className="danger-button inline-button settings-icon-button settings-logout-button"
              title={t('common.signOut')}
              type="button"
              onClick={logout}
            >
              {renderOptionIcon('logOut')}
            </button>
          </div>
        </div>
      </section>
    </section>
  );
}
