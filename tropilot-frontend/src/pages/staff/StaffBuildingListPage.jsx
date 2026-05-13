import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as buildingApi from '../../api/buildingApi.js';
import PageHeader from '../../components/PageHeader.jsx';

export default function StaffBuildingListPage() {
  const [buildings, setBuildings] = useState([]);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadBuildings = async (searchValue = appliedSearch) => {
    setLoading(true);
    setError('');

    try {
      const response = await buildingApi.getStaffBuildings(searchValue);
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

  return (
    <section className="content-section">
      <PageHeader eyebrow="Operations staff" title="Buildings" />

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
                <th>Details</th>
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
                    <Link className="secondary-link compact-link" to={`/staff/buildings/${building.id}`}>
                      View
                    </Link>
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
