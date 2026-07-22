import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as adminUserApi from '../../api/adminUserApi.js';
import AdminAccountDirectoryTable from '../../components/AdminAccountDirectoryTable.jsx';
import AdminUserCreateDialog from '../../components/AdminUserCreateDialog.jsx';
import FilterBar from '../../components/common/FilterBar.jsx';
import ManagementPageHero from '../../components/common/ManagementPageHero.jsx';
import { exportRowsToExcel } from '../../utils/excelExport.js';
import { normalizeSearchText } from '../../utils/searchText.js';

const MANAGED_ACCOUNT_ROLES = new Set(['ADMIN', 'STAFF']);

function normalize(value) {
  return normalizeSearchText(value);
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
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);
  const [createResetKey, setCreateResetKey] = useState(0);

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
      !searchValue || [account.fullName, account.email, account.phone]
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

  const handleOpenCreateDialog = () => {
    setCreateError('');
    setCreateResetKey((current) => current + 1);
    setCreateDialogOpen(true);
  };

  const handleCloseCreateDialog = () => {
    if (creating) {
      return;
    }

    setCreateDialogOpen(false);
    setCreateError('');
  };

  const handleCreateStaff = async (form) => {
    setCreateError('');
    setMessage('');
    setError('');
    setCreating(true);

    try {
      await adminUserApi.createUser({ ...form, role: 'STAFF' });
      setCreateDialogOpen(false);
      setMessage(t('userCreate.messages.staffCreated'));
      await loadAccounts();
    } catch (apiError) {
      setCreateError(apiError.response?.data?.message || t('userCreate.messages.createError'));
    } finally {
      setCreating(false);
    }
  };

  return (
    <section className="content-section account-directory-page modern-user-page">
      <ManagementPageHero
        title={t('userManagement.title')}
        description={t('userManagement.summary', { count: accounts.length })}
        actions={
          <>
          <button
            className="secondary-button inline-button"
            type="button"
            onClick={handleExport}
          >
            {t('userManagement.actions.exportExcel')}
          </button>
          <button
            className="button-link"
            type="button"
            onClick={handleOpenCreateDialog}
          >
            {t('userManagement.actions.create')}
          </button>
          </>
        }
      />

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      <div className="account-control-panel account-search-only-panel">
        <FilterBar
          as="div"
          className="account-search-control instant-account-filter"
          searchAriaLabel={t('userManagement.filters.searchAria')}
          searchPlaceholder={t('userManagement.filters.searchPlaceholder')}
          searchValue={search}
          suggestionFields={['fullName', 'email', 'phone']}
          suggestionItems={accounts}
          clearLabel={t('common.clear')}
          onClear={() => setSearch('')}
          onSearchChange={setSearch}
        />
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

      <AdminUserCreateDialog
        error={createError}
        loading={creating}
        open={createDialogOpen}
        resetKey={createResetKey}
        onClose={handleCloseCreateDialog}
        onSubmit={handleCreateStaff}
      />
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
