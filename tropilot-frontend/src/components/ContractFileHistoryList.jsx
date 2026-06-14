import { useTranslation } from 'react-i18next';
import { formatDisplayDateTime } from '../utils/dateFormat.js';
import { resolveFileUrl } from '../utils/fileUrl.js';

export default function ContractFileHistoryList({ files }) {
  const { t } = useTranslation();
  const previousFiles = Array.isArray(files) ? files : [];

  if (previousFiles.length === 0) {
    return null;
  }

  return (
    <section className="contract-history-panel">
      <div className="contract-history-header">
        <div>
          <span>{t('contracts.history.eyebrow')}</span>
          <strong>{t('contracts.history.title')}</strong>
        </div>
        <p>{t('contracts.history.description')}</p>
      </div>

      <div className="contract-history-list">
        {previousFiles.map((file, index) => (
          <article className="contract-history-item" key={file.id || `${file.fileUrl}-${index}`}>
            <div>
              <strong>{t('contracts.history.item', { number: previousFiles.length - index })}</strong>
              <span>
                {t('contracts.history.replaced', {
                  name: file.replacedByName || t('role.admin'),
                  date: formatDisplayDateTime(file.replacedAt, t('common.notProvided'))
                })}
              </span>
            </div>
            <a className="secondary-link" href={resolveFileUrl(file.fileUrl)} target="_blank" rel="noreferrer">
              {t('contracts.history.open')}
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
