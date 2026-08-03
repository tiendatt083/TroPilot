import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as activityLogApi from '../api/activityLogApi.js';
import ActivityLogTable, { formatAction, formatDateTime, formatDescription } from './ActivityLogTable.jsx';
import FilterBar from './common/FilterBar.jsx';
import ManagementPageHero from './common/ManagementPageHero.jsx';
import NotificationPaginationControls from './NotificationPaginationControls.jsx';

const HISTORY_PAGE_SIZE = 30;

/** Chuẩn hóa từ khóa để tìm nhật ký không phân biệt hoa thường và dấu tiếng Việt. */
function normalizeSearch(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Trang thành phần hiển thị lịch sử hoạt động của chính người dùng đang đăng nhập. */
export default function MyActivityLogPage() {
  const { t } = useTranslation();
  const [allLogs, setAllLogs] = useState([]);
  const [logPage, setLogPage] = useState(0);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const logs = useMemo(() => {
    const normalizedQuery = normalizeSearch(query);

    if (!normalizedQuery) {
      return allLogs;
    }

    return allLogs.filter((log) => {
      const searchableText = [
        formatAction(log.action, t),
        formatDescription(log.description, t),
        formatDateTime(log.createdAt, t),
        log.action,
        log.description,
        log.userFullName,
        log.userEmail,
        log.createdAt
      ].map(normalizeSearch).join(' ');

      return searchableText.includes(normalizedQuery);
    });
  }, [allLogs, query, t]);

  const pagedLogs = useMemo(() => {
    const start = logPage * HISTORY_PAGE_SIZE;
    return logs.slice(start, start + HISTORY_PAGE_SIZE);
  }, [logPage, logs]);

  useEffect(() => {
    let active = true;

    activityLogApi
      .getMyActivityLogs()
      .then((response) => {
        if (active) {
          setAllLogs(response.data);
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
    setLogPage(0);
  }, [query]);

  const handleClear = () => {
    setQuery('');
    setLogPage(0);
  };

  return (
    <section className="content-section management-page">
      <ManagementPageHero
        title={t('activityLogs.title')}
        description={t('activityLogs.summary', { count: allLogs.length })}
      />

      {error && <div className="alert error-alert">{error}</div>}

      <FilterBar
        as="div"
        searchAriaLabel={t('activityLogs.filterAriaLabel')}
        searchPlaceholder={t('activityLogs.filterPlaceholder')}
        searchValue={query}
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
