import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import * as adminUserApi from '../../api/adminUserApi.js';
import AdminAccountDirectoryTable from '../../components/AdminAccountDirectoryTable.jsx';
import PageHeader from '../../components/PageHeader.jsx';

const MANAGED_ACCOUNT_ROLES = new Set(['ADMIN', 'STAFF']);

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

export default function AdminUserListPage() {
  const { t } = useTranslation();
  const [accounts, setAccounts] = useState([]);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await adminUserApi.getUsers();
      setAccounts(response.data.filter((user) => MANAGED_ACCOUNT_ROLES.has(user.role)));
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('userManagement.messages.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const filteredAccounts = useMemo(() => {
    const searchValue = normalize(search);

    if (!searchValue) {
      return accounts;
    }

    return accounts.filter((account) => (
      [account.fullName, account.email, account.phone]
        .some((value) => normalize(value).includes(searchValue))
    ));
  }, [accounts, search]);

  const handleDelete = async (account) => {
    if (!window.confirm(t('accountDirectory.confirmations.delete', { name: account.fullName }))) {
      return;
    }

    setDeletingId(account.id);
    setMessage('');
    setError('');

    try {
      await adminUserApi.deleteUser(account.id);
      setMessage(t('accountDirectory.messages.deleted', { name: account.fullName }));
      await loadAccounts();
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('accountDirectory.messages.deleteError'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="content-section account-directory-page">
      <div className="page-title-row">
        <PageHeader
          eyebrow={t('userManagement.eyebrow')}
          title={t('userManagement.title')}
        />
        <Link
          className="button-link"
          to="/admin/users/create?role=STAFF&returnTo=/admin/users"
        >
          {t('userManagement.actions.create')}
        </Link>
      </div>

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      <div className="user-filter-row account-filter-row">
        <input
          aria-label={t('userManagement.filters.searchAria')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('userManagement.filters.searchPlaceholder')}
        />
        <button
          className="secondary-button inline-button"
          type="button"
          onClick={() => setSearch('')}
        >
          {t('common.clear')}
        </button>
      </div>

      {loading ? (
        <div className="empty-state">{t('userManagement.messages.loading')}</div>
      ) : (
        <AdminAccountDirectoryTable
          accounts={filteredAccounts}
          deletingId={deletingId}
          emptyMessage={t('userManagement.messages.empty')}
          onDelete={handleDelete}
        />
      )}
    </section>
  );
}
