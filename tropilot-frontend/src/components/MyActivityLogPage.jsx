import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as activityLogApi from '../api/activityLogApi.js';
import ActivityLogTable from './ActivityLogTable.jsx';
import ManagementPageHero from './common/ManagementPageHero.jsx';
import NotificationPaginationControls from './NotificationPaginationControls.jsx';

const HISTORY_PAGE_SIZE = 30;

export default function MyActivityLogPage() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [logPage, setLogPage] = useState(0);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const pagedLogs = useMemo(() => {
    const start = logPage * HISTORY_PAGE_SIZE;
    return logs.slice(start, start + HISTORY_PAGE_SIZE);
  }, [logPage, logs]);

  const loadLogs = async (targetQuery = query) => {
    setError('');

    try {
      const response = await activityLogApi.getMyActivityLogs(targetQuery.trim());
      setLogs(response.data);
      setLogPage(0);
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('activityLogs.loadError'));
    }
  };

  useEffect(() => {
    let active = true;

    activityLogApi
      .getMyActivityLogs()
      .then((response) => {
        if (active) {
          setLogs(response.data);
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
    setQuery('');
    loadLogs('');
  };

  return (
    <section className="content-section management-page">
      <ManagementPageHero
        title={t('activityLogs.title')}
        description={t('activityLogs.summary', { count: logs.length })}
      />

      {error && <div className="alert error-alert">{error}</div>}

      <form className="search-row" onSubmit={handleSubmit}>
        <input
          aria-label={t('activityLogs.filterAriaLabel')}
          placeholder={t('activityLogs.filterPlaceholder')}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button className="inline-button" type="submit">{t('common.search')}</button>
        <button className="secondary-button inline-button" type="button" onClick={handleClear}>
          {t('common.clear')}
        </button>
      </form>

      {loading ? (
        <div className="empty-state">{t('activityLogs.loading')}</div>
      ) : (
        <>
          <ActivityLogTable logs={pagedLogs} showUser={false} />
          <NotificationPaginationControls
            page={logPage}
            pageSize={HISTORY_PAGE_SIZE}
            totalItems={logs.length}
            onPageChange={setLogPage}
            translationPrefix="activityLogs"
          />
        </>
      )}
    </section>
  );
}
