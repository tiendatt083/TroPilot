import { useEffect, useState } from 'react';
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
      setError(apiError.response?.data?.message || 'Buildings could not be loaded');
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
      setMessage('Building deleted successfully.');
      setPendingDelete(null);
      await loadBuildings(appliedSearch);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Building could not be deleted');
    } finally {
      setDeletingId(null);
    }
  };

  const columns = [
    { key: 'buildingCode', header: 'Code' },
    { key: 'name', header: 'Name' },
    { key: 'address', header: 'Address' },
    { key: 'floors', header: 'Floors' },
    {
      key: 'actions',
      header: canManage ? 'Actions' : 'Details',
      render: (building) => (
        <div className="table-actions">
          <Link className="secondary-link compact-link" to={`${basePath}/${building.id}`}>
            {canManage ? 'Manage' : 'View'}
          </Link>
          {canManage && (
            <>
              <Link className="secondary-link compact-link" to={`${basePath}/${building.id}/edit`}>
                Edit
              </Link>
              <button
                className="secondary-button compact-button"
                type="button"
                disabled={deletingId === building.id}
                onClick={() => setPendingDelete(building)}
              >
                Delete
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
            Create building
          </Link>
        )}
      </div>

      <FilterBar onSubmit={handleSearch}>
        <input
          aria-label="Search buildings"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by code or name"
        />
        <button type="submit">Search</button>
        <button className="secondary-button inline-button" type="button" onClick={handleClearSearch}>
          Clear
        </button>
      </FilterBar>

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <EmptyState message="Loading buildings..." />
      ) : (
        <DataTable caption="Buildings" columns={columns} emptyMessage="No buildings found." rows={buildings} />
      )}

      <ConfirmDialog
        confirmLabel="Delete"
        loading={Boolean(deletingId)}
        message={pendingDelete ? `Delete building ${pendingDelete.buildingCode}?` : ''}
        open={Boolean(pendingDelete)}
        title="Delete building"
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDelete}
      />
    </section>
  );
}
