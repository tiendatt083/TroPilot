import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import ConfirmDialog from '../common/ConfirmDialog.jsx';
import DataTable from '../common/DataTable.jsx';
import EmptyState from '../common/EmptyState.jsx';
import FilterBar from '../common/FilterBar.jsx';
import PageHeader from '../common/PageHeader.jsx';

export default function BuildingListWorkspace({
  getBuildings,
  basePath,
  eyebrow,
  title,
  canManage = false,
  createPath,
  deleteBuilding
}) {
  const { t } = useTranslation();
  const [buildings, setBuildings] = useState([]);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const loadBuildings = async (searchValue = appliedSearch) => {
    setLoading(true);
    setError('');

    try {
      const response = await getBuildings(searchValue);
      setBuildings(response.data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('workspace.buildings.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBuildings('');
  }, []);

  const handleSearch = (event) => {
    event.preventDefault();
    const nextSearch = search.trim();
    setAppliedSearch(nextSearch);
    loadBuildings(nextSearch);
  };

  const handleClearSearch = () => {
    setSearch('');
    setAppliedSearch('');
    loadBuildings('');
  };

  const handleDelete = async () => {
    if (!pendingDelete || !deleteBuilding) {
      return;
    }

    setDeletingId(pendingDelete.id);
    setMessage('');
    setError('');

    try {
      await deleteBuilding(pendingDelete.id);
      setMessage(t('workspace.buildings.deleted'));
      setPendingDelete(null);
      await loadBuildings(appliedSearch);
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('workspace.buildings.deleteError'));
    } finally {
      setDeletingId(null);
    }
  };

  const columns = [
    { key: 'buildingCode', header: t('tables.common.code') },
    { key: 'name', header: t('tables.common.name') },
    { key: 'address', header: t('buildingOverview.fields.address') },
    { key: 'floors', header: t('buildingOverview.fields.floors') },
    {
      key: 'actions',
      header: canManage ? t('tables.common.actions') : t('workspace.buildings.details'),
      render: (building) => (
        <div className="table-actions">
          <Link className="secondary-link compact-link" to={`${basePath}/${building.id}`}>
            {canManage ? t('workspace.buildings.manage') : t('common.view')}
          </Link>
          {canManage && (
            <>
              <Link className="secondary-link compact-link" to={`${basePath}/${building.id}/edit`}>
                {t('common.edit')}
              </Link>
              <button
                className="secondary-button compact-button"
                type="button"
                disabled={deletingId === building.id}
                onClick={() => setPendingDelete(building)}
              >
                {t('common.delete')}
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  return (
    <section className="content-section">
      <div className="page-title-row">
        <PageHeader eyebrow={eyebrow} title={title} />
        {canManage && createPath && (
          <Link className="button-link" to={createPath}>
            {t('workspace.buildings.create')}
          </Link>
        )}
      </div>

      <FilterBar onSubmit={handleSearch}>
        <input
          aria-label={t('workspace.buildings.searchAria')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('workspace.buildings.searchPlaceholder')}
        />
        <button type="submit">{t('common.filter')}</button>
        <button className="secondary-button inline-button" type="button" onClick={handleClearSearch}>
          {t('common.clear')}
        </button>
      </FilterBar>

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <EmptyState message={t('workspace.buildings.loading')} />
      ) : (
        <DataTable
          caption={t('workspace.buildings.caption')}
          columns={columns}
          emptyMessage={t('workspace.buildings.empty')}
          rows={buildings}
        />
      )}

      <ConfirmDialog
        confirmLabel={t('common.delete')}
        loading={Boolean(deletingId)}
        message={pendingDelete ? t('workspace.buildings.deleteConfirm', { code: pendingDelete.buildingCode }) : ''}
        open={Boolean(pendingDelete)}
        title={t('workspace.buildings.deleteTitle')}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDelete}
      />
    </section>
  );
}
