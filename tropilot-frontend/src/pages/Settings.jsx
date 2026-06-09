import { useTranslation } from 'react-i18next';
import PageHeader from '../components/PageHeader.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

const LANGUAGE_STORAGE_KEY = 'lang';
const THEME_OPTIONS = ['light', 'dark', 'system'];

function normalizeLanguage(language) {
  return language?.startsWith('en') ? 'en' : 'vi';
}

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const currentLanguage = normalizeLanguage(i18n.language);

  const handleLanguageChange = (language) => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    i18n.changeLanguage(language);
  };

  return (
    <section className="content-section narrow-section">
      <div className="page-title-row">
        <PageHeader eyebrow="Tropilot" title={t('settings.title')} />
      </div>

      <section className="settings-panel">
        <div className="settings-group">
          <div className="settings-language-summary">
            <span>{t('settings.language')}</span>
            <strong>{currentLanguage === 'vi' ? t('settings.vietnamese') : t('settings.english')}</strong>
            <p>{t('settings.languageDescription')}</p>
          </div>

          <div className="settings-language-actions">
            <button
              aria-pressed={currentLanguage === 'vi'}
              className={currentLanguage === 'vi' ? 'inline-button' : 'secondary-button inline-button'}
              type="button"
              onClick={() => handleLanguageChange('vi')}
            >
              {t('settings.vietnamese')}
            </button>
            <button
              aria-pressed={currentLanguage === 'en'}
              className={currentLanguage === 'en' ? 'inline-button' : 'secondary-button inline-button'}
              type="button"
              onClick={() => handleLanguageChange('en')}
            >
              {t('settings.english')}
            </button>
          </div>
        </div>

        <div className="settings-divider" />

        <div className="settings-group">
          <div className="settings-language-summary">
            <span>{t('settings.appearance')}</span>
            <strong>{t(`settings.themes.${theme}`)}</strong>
            <p>
              {t('settings.themeDescription', {
                theme: t(`settings.themes.${resolvedTheme}`)
              })}
            </p>
          </div>

          <div className="settings-language-actions">
            {THEME_OPTIONS.map((themeOption) => (
              <button
                key={themeOption}
                aria-pressed={theme === themeOption}
                className={theme === themeOption ? 'inline-button' : 'secondary-button inline-button'}
                type="button"
                onClick={() => setTheme(themeOption)}
              >
                {t(`settings.themes.${themeOption}`)}
              </button>
            ))}
          </div>
        </div>
      </section>
    </section>
  );
}
