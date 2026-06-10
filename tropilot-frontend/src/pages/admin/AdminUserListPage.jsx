import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import * as adminUserApi from '../../api/adminUserApi.js';
import PageHeader from '../../components/PageHeader.jsx';

const MANAGED_ACCOUNT_ROLES = new Set(['ADMIN', 'STAFF']);

function normalizeSearchValue(value) {
  return String(value || '').trim().toLowerCase();
}

function filterAccounts(accounts, search) {
  const searchValue = normalizeSearchValue(search);

  if (!searchValue) {
    return accounts;
  }

  return accounts.filter((account) => (
    [account.fullName, account.email, account.phone]
      .some((value) => normalizeSearchValue(value).includes(searchValue))
  ));
}

export default function AdminUserListPage() {
  const { t } = useTranslation();
  const [accounts, setAccounts] = useState([]);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  const loadAccounts = async () => {
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
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const filteredAccounts = useMemo(
    () => filterAccounts(accounts, search),
    [accounts, search]
  );

  const handleStatusAction = async (user, action) => {
    const confirmationKey = action === 'lock'
      ? 'userManagement.confirmations.lock'
      : 'userManagement.confirmations.unlock';

    if (!window.confirm(t(confirmationKey, { name: user.fullName }))) {
      return;
    }

    setActionId(user.id);
    setMessage('');
    setError('');

    try {
      if (action === 'lock') {
        await adminUserApi.lockUser(user.id);
        setMessage(t('userManagement.messages.locked', { name: user.fullName }));
      } else {
        await adminUserApi.unlockUser(user.id);
        setMessage(t('userManagement.messages.unlocked', { name: user.fullName }));
      }

      await loadAccounts();
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('userManagement.messages.statusError'));
    } finally {
      setActionId(null);
    }
  };

  const handleResetPassword = async (user) => {
    if (!window.confirm(t('userManagement.confirmations.resetPassword', { name: user.fullName }))) {
      return;
    }

    setActionId(user.id);
    setMessage('');
    setError('');

    try {
      const response = await adminUserApi.resetPassword(user.id);
      setMessage(t('userManagement.messages.passwordReset', {
        name: user.fullName,
        password: response.data.temporaryPassword
      }));
      await loadAccounts();
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('userManagement.messages.passwordError'));
    } finally {
      setActionId(null);
    }
  };

  return (
    <section className="content-section">
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
        <div className="table-wrap">
          <table className="data-table account-table">
            <thead>
              <tr>
                <th>{t('userManagement.columns.name')}</th>
                <th>{t('userManagement.columns.email')}</th>
                <th>{t('userManagement.columns.role')}</th>
                <th>{t('userManagement.columns.status')}</th>
                <th>{t('userManagement.columns.temporaryPassword')}</th>
                <th>{t('userManagement.columns.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map((user) => (
                <tr key={user.id}>
                  <td>
                    <strong>{user.fullName}</strong>
                    {user.phone && <span className="table-subtext">{user.phone}</span>}
                  </td>
                  <td>{user.email}</td>
                  <td>{formatRole(user.role, t)}</td>
                  <td>
                    <span className={`status-pill status-${user.status.toLowerCase()}`}>
                      {formatStatus(user.status, t)}
                    </span>
                  </td>
                  <td>
                    {user.mustChangePassword ? (
                      <span className="temporary-password-value">
                        {user.temporaryPassword || t('userManagement.passwordUnavailable')}
                      </span>
                    ) : (
                      <span className="muted-text">{t('userManagement.passwordChanged')}</span>
                    )}
                  </td>
                  <td>
                    <div className="table-actions">
                      {user.status === 'LOCKED' ? (
                        <button
                          className="secondary-button compact-button"
                          type="button"
                          disabled={actionId === user.id}
                          onClick={() => handleStatusAction(user, 'unlock')}
                        >
                          {t('userManagement.actions.unlock')}
                        </button>
                      ) : (
                        <button
                          className="secondary-button compact-button"
                          type="button"
                          disabled={actionId === user.id || user.role === 'ADMIN'}
                          onClick={() => handleStatusAction(user, 'lock')}
                        >
                          {t('userManagement.actions.lock')}
                        </button>
                      )}
                      <button
                        className="secondary-button compact-button"
                        type="button"
                        disabled={actionId === user.id || user.role === 'ADMIN'}
                        onClick={() => handleResetPassword(user)}
                      >
                        {t('userManagement.actions.regenerate')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredAccounts.length === 0 && (
            <div className="empty-state flat-empty-state">
              {t('userManagement.messages.empty')}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function formatRole(role, t) {
  return role === 'STAFF' ? t('role.staff') : t('role.admin');
}

function formatStatus(status, t) {
  return status === 'LOCKED'
    ? t('userManagement.status.locked')
    : t('userManagement.status.active');
}
