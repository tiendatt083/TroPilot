import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import * as adminUserApi from '../../features/users/api.js';
import AdminAccountDirectoryTable from '../../components/AdminAccountDirectoryTable.jsx';
import { exportRowsToExcel } from '../../utils/excelExport.js';

const MANAGED_ACCOUNT_ROLES = new Set(['ADMIN', 'STAFF']);
const ROLE_FILTERS = ['ALL', 'ADMIN', 'STAFF'];

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function buildExportFileName() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();

  return `tropilot-users-${day}-${month}-${year}.xlsx`;
}

export default function AdminUserListPage() {
  const { t } = useTranslation();
  const [accounts, setAccounts] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
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

    return accounts.filter((account) => (
      (roleFilter === 'ALL' || account.role === roleFilter)
      && (!searchValue || [account.fullName, account.email, account.phone]
        .some((value) => normalize(value).includes(searchValue))
      )
    ));
  }, [accounts, roleFilter, search]);

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

  const handleExport = () => {
    setMessage('');
    setError('');

    if (filteredAccounts.length === 0) {
      setError(t('userManagement.messages.exportEmpty'));
      return;
    }

    const rows = filteredAccounts.map((account, index) => ({
      [t('accountDirectory.columns.id')]: index + 1,
      [t('userManagement.columns.name')]: account.fullName || t('common.notProvided'),
      [t('accountDirectory.detail.phone')]: account.phone || t('common.notProvided'),
      [t('accountDirectory.columns.email')]: account.email || t('common.notProvided'),
      [t('accountDirectory.detail.role')]: formatRole(account.role, t),
      [t('accountDirectory.columns.status')]: formatStatus(account.status, t),
      [t('accountDirectory.columns.temporaryPassword')]: formatTemporaryPassword(account, t)
    }));

    exportRowsToExcel({
      rows,
      fileName: buildExportFileName(),
      sheetName: t('userManagement.export.sheetName')
    });
  };

  return (
    <section className="content-section account-directory-page modern-user-page">
      <div className="account-page-hero">
        <div>
          <h1>{t('userManagement.title')}</h1>
          <p>{t('userManagement.summary', { count: accounts.length })}</p>
        </div>
        <div className="page-action-row">
          <button
            className="secondary-button inline-button"
            type="button"
            onClick={handleExport}
          >
            {t('userManagement.actions.exportExcel')}
          </button>
          <Link
            className="button-link"
            to="/admin/users/create?role=STAFF&returnTo=/admin/users"
          >
            {t('userManagement.actions.create')}
          </Link>
        </div>
      </div>

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      <div className="account-control-panel">
        <div className="account-role-filter">
          <span>{t('userManagement.filters.roleLabel')}</span>
          <div className="account-role-chips" role="group" aria-label={t('userManagement.filters.roleLabel')}>
            {ROLE_FILTERS.map((role) => (
              <button
                className={`account-role-chip${roleFilter === role ? ' is-active' : ''}`}
                key={role}
                type="button"
                aria-pressed={roleFilter === role}
                onClick={() => setRoleFilter(role)}
              >
                {role === 'ALL' ? t('userManagement.filters.allRoles') : formatRole(role, t)}
              </button>
            ))}
          </div>
        </div>
        <div className="account-search-control">
          <input
            aria-label={t('userManagement.filters.searchAria')}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('userManagement.filters.searchPlaceholder')}
          />
          <button
            className="secondary-button inline-button"
            type="button"
            onClick={() => {
              setSearch('');
              setRoleFilter('ALL');
            }}
          >
            {t('common.clear')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">{t('userManagement.messages.loading')}</div>
      ) : (
        <AdminAccountDirectoryTable
          accounts={filteredAccounts}
          deletingId={deletingId}
          emptyMessage={t('userManagement.messages.empty')}
          nameColumnLabel={t('userManagement.columns.name')}
          showRole
          showStatus={false}
          useIconActions
          onDelete={handleDelete}
        />
      )}
    </section>
  );
}

function formatRole(role, t) {
  if (role === 'STAFF') {
    return t('role.staff');
  }

  if (role === 'RESIDENT_HEAD') {
    return t('role.residentHead');
  }

  return t('role.admin');
}

function formatStatus(status, t) {
  if (status === 'LOCKED') {
    return t('userManagement.status.locked');
  }

  if (status === 'INACTIVE') {
    return t('common.inactive');
  }

  return t('userManagement.status.active');
}

function formatTemporaryPassword(account, t) {
  if (!account.mustChangePassword) {
    return t('userManagement.passwordChanged');
  }

  return account.temporaryPassword || t('userManagement.passwordUnavailable');
}
