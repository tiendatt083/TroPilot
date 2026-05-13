import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as buildingApi from '../../api/buildingApi.js';
import PageHeader from '../../components/PageHeader.jsx';

export default function AdminBuildingListPage() {
  const [buildings, setBuildings] = useState([]);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

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

  const handleDelete = async (building) => {
    const confirmed = window.confirm(`Delete building ${building.buildingCode}?`);
    if (!confirmed) {
      return;
    }

    setDeletingId(building.id);
    setMessage('');
    setError('');

    try {
      await buildingApi.deleteAdminBuilding(building.id);
      setMessage('Building deleted successfully.');
      await loadBuildings(appliedSearch);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Building could not be deleted');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="content-section">
      <div className="page-title-row">
        <PageHeader eyebrow="Administrator" title="Building management" />
        <Link className="button-link" to="/admin/buildings/create">
          Create building
        </Link>
      </div>

      <form className="search-row" onSubmit={handleSearch}>
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
      </form>

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading buildings...</div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Address</th>
                <th>Floors</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {buildings.map((building) => (
                <tr key={building.id}>
                  <td>{building.buildingCode}</td>
                  <td>{building.name}</td>
                  <td>{building.address}</td>
                  <td>{building.floors}</td>
                  <td>
                    <div className="table-actions">
                      <Link className="secondary-link compact-link" to={`/admin/buildings/${building.id}`}>
                        View
                      </Link>
                      <Link className="secondary-link compact-link" to={`/admin/buildings/${building.id}/edit`}>
                        Edit
                      </Link>
                      <button
                        className="secondary-button compact-button"
                        type="button"
                        disabled={deletingId === building.id}
                        onClick={() => handleDelete(building)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {buildings.length === 0 && <div className="empty-state flat-empty-state">No buildings found.</div>}
        </div>
      )}
    </section>
  );
}
