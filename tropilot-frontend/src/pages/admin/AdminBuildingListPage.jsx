import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as buildingApi from '../../api/buildingApi.js';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import FilterBar from '../../components/common/FilterBar.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';

export default function AdminBuildingListPage() {
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
      const response = await buildingApi.getAdminBuildings(searchValue);
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
    setAppliedSearch(search.trim());
    loadBuildings(search.trim());
  };

  const handleClearSearch = () => {
    setSearch('');
    setAppliedSearch('');
    loadBuildings('');
  };

  const handleDelete = async () => {
    if (!pendingDelete) {
      return;
    }

    setDeletingId(pendingDelete.id);
    setMessage('');
    setError('');

    try {
      await buildingApi.deleteAdminBuilding(pendingDelete.id);
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
      header: 'Actions',
      render: (building) => (
        <div className="table-actions">
          <Link className="secondary-link compact-link" to={`/admin/buildings/${building.id}`}>
            Manage
          </Link>
          <Link className="secondary-link compact-link" to={`/admin/buildings/${building.id}/edit`}>
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
        </div>
      ),
    },
  ];

  return (
    <section className="content-section">
      <div className="page-title-row">
        <PageHeader eyebrow="Administrator" title="Building management" />
        <Link className="button-link" to="/admin/buildings/create">
          Create building
        </Link>
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
        <DataTable
          caption="Buildings"
          columns={columns}
          emptyMessage="No buildings found."
          rows={buildings}
        />
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
