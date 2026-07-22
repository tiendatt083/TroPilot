import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import BuildingForm from '../BuildingForm.jsx';
import ActionDialog from '../common/ActionDialog.jsx';
import ConfirmDialog from '../common/ConfirmDialog.jsx';
import DataTable from '../common/DataTable.jsx';
import EmptyState from '../common/EmptyState.jsx';
import FilterBar from '../common/FilterBar.jsx';
import ManagementPageHero from '../common/ManagementPageHero.jsx';
import PageHeader from '../common/PageHeader.jsx';
import { exportRowsToExcel } from '../../utils/excelExport.js';
import { normalizeSearchText } from '../../utils/searchText.js';

function buildingMatchesSearch(building, searchValue) {
  if (!searchValue) {
    return true;
  }

  return [
    building.buildingCode,
    building.name,
    building.address
  ].some((value) => normalizeSearchText(value).includes(searchValue));
}

function buildExportFileName() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();

  return `tropilot-buildings-${day}-${month}-${year}.xlsx`;
}

export default function BuildingListWorkspace({
  getBuildings,
  basePath,
  eyebrow,
  title,
  canManage = false,
  createPath,
  createBuilding,
  updateBuilding,
  deleteBuilding
}) {
  const { t } = useTranslation();
  const [buildings, setBuildings] = useState([]);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingForm, setSavingForm] = useState(false);
  const [formError, setFormError] = useState('');
  const [activeForm, setActiveForm] = useState({ mode: '', building: null });
  const [deletingId, setDeletingId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const canUseDialogForm = canManage && createBuilding && updateBuilding;

  const loadBuildings = async (searchValue = appliedSearch) => {
    setLoading(true);
    setError('');

    try {
      const response = await getBuildings();
      const searchText = normalizeSearchText(searchValue);
      setBuildings((response.data || []).filter((building) => buildingMatchesSearch(building, searchText)));
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('workspace.buildings.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBuildings('');
  }, []);

  useEffect(() => {
    const nextSearch = search.trim();
    const timer = window.setTimeout(() => {
      setAppliedSearch(nextSearch);
      loadBuildings(nextSearch);
    }, search ? 250 : 0);

    return () => window.clearTimeout(timer);
  }, [search]);

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

  const handleOpenCreate = () => {
    setFormError('');
    setActiveForm({ mode: 'create', building: null });
  };

  const handleOpenEdit = (building) => {
    setFormError('');
    setActiveForm({ mode: 'edit', building });
  };

  const handleCloseForm = () => {
    if (savingForm) {
      return;
    }

    setActiveForm({ mode: '', building: null });
    setFormError('');
  };

  const handleSaveForm = async (payload) => {
    if (!canUseDialogForm) {
      return;
    }

    setSavingForm(true);
    setFormError('');
    setMessage('');
    setError('');

    try {
      if (activeForm.mode === 'edit') {
        await updateBuilding(activeForm.building.id, payload);
        setMessage(t('workspace.buildings.updated'));
      } else {
        await createBuilding(payload);
        setMessage(t('workspace.buildings.created'));
      }

      setActiveForm({ mode: '', building: null });
      await loadBuildings(appliedSearch);
    } catch (apiError) {
      setFormError(
        apiError.response?.data?.message
          || (activeForm.mode === 'edit'
            ? t('workspace.buildings.updateError')
            : t('workspace.buildings.createError'))
      );
    } finally {
      setSavingForm(false);
    }
  };

  const handleExport = () => {
    setMessage('');
    setError('');

    if (buildings.length === 0) {
      setError(t('workspace.buildings.exportEmpty'));
      return;
    }

    const rows = buildings.map((building) => ({
      [t('tables.common.code')]: building.buildingCode || t('common.notProvided'),
      [t('tables.common.name')]: building.name || t('common.notProvided'),
      [t('buildingOverview.fields.address')]: building.address || t('common.notProvided'),
      [t('buildingOverview.fields.floors')]: building.floors ?? t('common.notProvided')
    }));

    exportRowsToExcel({
      rows,
      fileName: buildExportFileName(),
      sheetName: t('workspace.buildings.exportSheetName')
    });
  };

  const columns = [
    { key: 'buildingCode', header: t('tables.common.code') },
    { key: 'name', header: t('tables.common.name') },
    { key: 'address', header: t('buildingOverview.fields.address') },
    { key: 'floors', header: t('buildingOverview.fields.floors') },
    {
      key: 'actions',
      header: canManage ? t('tables.common.actions') : t('workspace.buildings.details'),
      cellClassName: 'building-actions-cell',
      headerClassName: 'building-actions-column',
      render: (building) => (
        <div className="table-actions icon-table-actions">
          <Link
            aria-label={canManage ? t('workspace.buildings.manage') : t('common.view')}
            className="icon-action-button"
            data-tooltip={canManage ? t('workspace.buildings.manage') : t('common.view')}
            to={`${basePath}/${building.id}`}
          >
            <EyeIcon />
          </Link>
          {canManage && (
            <>
              {canUseDialogForm ? (
                <button
                  aria-label={t('common.edit')}
                  className="icon-action-button"
                  data-tooltip={t('common.edit')}
                  type="button"
                  onClick={() => handleOpenEdit(building)}
                >
                  <EditIcon />
                </button>
              ) : (
                <Link
                aria-label={t('common.edit')}
                className="icon-action-button"
                data-tooltip={t('common.edit')}
                to={`${basePath}/${building.id}/edit`}
              >
                <EditIcon />
              </Link>
              )}
              <button
                aria-label={t('common.delete')}
                className="icon-action-button icon-action-danger"
                data-tooltip={t('common.delete')}
                type="button"
                disabled={deletingId === building.id}
                onClick={() => setPendingDelete(building)}
              >
                <TrashIcon />
              </button>
            </>
          )}
        </div>
      )
    }
  ];
  const createAction = canManage
    ? (canUseDialogForm ? (
      <button className="button-link" type="button" onClick={handleOpenCreate}>
        {t('workspace.buildings.create')}
      </button>
    ) : createPath ? (
      <Link className="button-link" to={createPath}>
        {t('workspace.buildings.create')}
      </Link>
    ) : null)
    : null;
  const buildingActions = canManage && (
    <>
      <button className="secondary-button inline-button" type="button" onClick={handleExport}>
        {t('workspace.buildings.exportExcel')}
      </button>
      {createAction}
    </>
  );

  return (
    <section className={`content-section${canManage ? ' management-page' : ''}`}>
      {canManage ? (
        <ManagementPageHero
          title={t('buildingManagement.adminTitle')}
          description={t('buildingManagement.summary', { count: buildings.length })}
          actions={buildingActions}
        />
      ) : (
        <div className="page-title-row">
          <PageHeader eyebrow={eyebrow} title={title} />
        </div>
      )}

      <FilterBar
        as="div"
        searchAriaLabel={t('workspace.buildings.searchAria')}
        searchPlaceholder={t('workspace.buildings.searchPlaceholder')}
        searchValue={search}
        suggestionFields={['buildingCode', 'name', 'address']}
        suggestionItems={buildings}
        clearLabel={t('common.clear')}
        onClear={handleClearSearch}
        onSearchChange={setSearch}
      />

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <EmptyState message={t('workspace.buildings.loading')} />
      ) : (
        <DataTable
          caption={t('workspace.buildings.caption')}
          className="building-list-table-wrap"
          columns={columns}
          emptyMessage={t('workspace.buildings.empty')}
          rows={buildings}
          tableClassName="building-list-table"
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
      <ActionDialog
        className="action-dialog"
        eyebrow={eyebrow}
        labelledBy="building-form-dialog-title"
        open={Boolean(activeForm.mode)}
        title={activeForm.mode === 'edit' ? t('workspace.buildings.editTitle') : t('workspace.buildings.create')}
        onClose={handleCloseForm}
      >
        {formError && <div className="alert error-alert">{formError}</div>}
        <BuildingForm
          initialValues={activeForm.building}
          loading={savingForm}
          submitLabel={activeForm.mode === 'edit' ? t('common.saveChanges') : t('workspace.buildings.create')}
          onSubmit={handleSaveForm}
        />
      </ActionDialog>
    </section>
  );
}

function EyeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" />
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M4 7h16" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M6 7l1 14h10l1-14" />
      <path d="M9 7V4h6v3" />
    </svg>
  );
}
