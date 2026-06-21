import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as activityLogApi from '../../api/activityLogApi.js';
import ActivityLogTable from '../../components/ActivityLogTable.jsx';
import NotificationPaginationControls from '../../components/NotificationPaginationControls.jsx';
import PageHeader from '../../components/PageHeader.jsx';

const HISTORY_PAGE_SIZE = 30;

export default function AdminActivityLogPage() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [logPage, setLogPage] = useState(0);
  const [action, setAction] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const pagedLogs = useMemo(() => {
    const start = logPage * HISTORY_PAGE_SIZE;
    return logs.slice(start, start + HISTORY_PAGE_SIZE);
  }, [logPage, logs]);

  const loadLogs = async (targetAction = action) => {
    setError('');

    try {
      const response = await activityLogApi.getAdminActivityLogs(targetAction.trim());
      setLogs(response.data);
      setLogPage(0);
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('activityLogs.loadError'));
    }
  };

  useEffect(() => {
    let active = true;

    activityLogApi
      .getAdminActivityLogs()
      .then((response) => {
        if (active) {
          setLogs(response.data);
          setLogPage(0);
        }
      })
      .catch((apiError) => {
        if (active) {
          setError(apiError.response?.data?.message || t('activityLogs.loadError'));
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [t]);

  const handleSubmit = (event) => {
    event.preventDefault();
    loadLogs();
  };

  const handleClear = () => {
    setAction('');
    loadLogs('');
  };

  const handleLogPageChange = (page) => {
    setLogPage(page);
  };

  return (
    <section className="content-section">
      <PageHeader eyebrow={t('activityLogs.eyebrow')} title={t('activityLogs.title')} />

      {error && <div className="alert error-alert">{error}</div>}

      <form className="search-row" onSubmit={handleSubmit}>
        <input
          aria-label={t('activityLogs.filterAriaLabel')}
          placeholder={t('activityLogs.filterPlaceholder')}
          value={action}
          onChange={(event) => setAction(event.target.value)}
        />
        <button className="inline-button" type="submit">
          {t('common.filter')}
        </button>
        <button className="secondary-button inline-button" type="button" onClick={handleClear}>
          {t('common.clear')}
        </button>
      </form>

      {loading ? (
        <div className="empty-state">{t('activityLogs.loading')}</div>
      ) : (
        <>
          <ActivityLogTable logs={pagedLogs} />
          <NotificationPaginationControls
            page={logPage}
            pageSize={HISTORY_PAGE_SIZE}
            totalItems={logs.length}
            onPageChange={handleLogPageChange}
            translationPrefix="activityLogs"
          />
        </>
      )}
    </section>
  );
}
