import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as activityLogApi from '../api/activityLogApi.js';
import ActivityLogTable from './ActivityLogTable.jsx';
import FilterBar from './common/FilterBar.jsx';
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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadLogs(query);
    }, query ? 250 : 0);

    return () => window.clearTimeout(timer);
  }, [query]);

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

      <FilterBar
        as="div"
        searchAriaLabel={t('activityLogs.filterAriaLabel')}
        searchPlaceholder={t('activityLogs.filterPlaceholder')}
        searchValue={query}
        suggestionFields={['action', 'description', 'createdByName']}
        suggestionItems={logs}
        clearLabel={t('common.clear')}
        onClear={handleClear}
        onSearchChange={setQuery}
      />

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
