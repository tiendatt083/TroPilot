import { useTranslation } from 'react-i18next';
import PageHeader from '../components/PageHeader.jsx';

const LANGUAGE_STORAGE_KEY = 'lang';

function normalizeLanguage(language) {
  return language?.startsWith('en') ? 'en' : 'vi';
}

export default function Settings() {
  const { t, i18n } = useTranslation();
  const currentLanguage = normalizeLanguage(i18n.language);

  const handleLanguageChange = (language) => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    i18n.changeLanguage(language);
  };

  return (
    <section className="content-section narrow-section">
      <div className="page-title-row">
        <PageHeader eyebrow="Tropilot" title={t('settings')} />
      </div>

      <section className="settings-panel">
        <div className="settings-language-summary">
          <span>{t('language')}</span>
          <strong>{currentLanguage === 'vi' ? t('vietnamese') : t('english')}</strong>
        </div>

        <div className="settings-language-actions">
          <button
            className={currentLanguage === 'vi' ? undefined : 'secondary-button inline-button'}
            type="button"
            onClick={() => handleLanguageChange('vi')}
          >
            {t('vietnamese')}
          </button>
          <button
            className={currentLanguage === 'en' ? undefined : 'secondary-button inline-button'}
            type="button"
            onClick={() => handleLanguageChange('en')}
          >
            {t('english')}
          </button>
        </div>
      </section>
    </section>
  );
}
