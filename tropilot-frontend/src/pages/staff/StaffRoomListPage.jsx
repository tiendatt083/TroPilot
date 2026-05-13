import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as buildingApi from '../../api/buildingApi.js';
import * as roomApi from '../../api/roomApi.js';
import PageHeader from '../../components/PageHeader.jsx';
import { ROOM_STATUS_OPTIONS, getRoomStatusLabel } from '../../utils/roomStatusOptions.js';

const emptyFilters = {
  search: '',
  buildingId: '',
  status: ''
};

function formatNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue)
    ? numberValue.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : value;
}

function statusClass(status) {
  return `status-pill room-status-${status.toLowerCase()}`;
}

export default function StaffRoomListPage() {
  const [rooms, setRooms] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadRooms = async (filterValues = appliedFilters) => {
    setLoading(true);
    setError('');

    try {
      const response = await roomApi.getStaffRooms(filterValues);
      setRooms(response.data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Rooms could not be loaded');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    buildingApi
      .getStaffBuildings()
      .then((response) => setBuildings(response.data))
      .catch((apiError) => setError(apiError.response?.data?.message || 'Buildings could not be loaded'));
    loadRooms(emptyFilters);
  }, []);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handleSearch = (event) => {
    event.preventDefault();
    const nextFilters = {
      ...filters,
      search: filters.search.trim()
    };
    setAppliedFilters(nextFilters);
    loadRooms(nextFilters);
  };

  const handleClearFilters = () => {
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    loadRooms(emptyFilters);
  };

  return (
    <section className="content-section">
      <PageHeader eyebrow="Operations staff" title="Rooms" />

      <form className="filter-row" onSubmit={handleSearch}>
        <input
          aria-label="Search rooms"
          name="search"
          value={filters.search}
          onChange={handleFilterChange}
          placeholder="Search by code or name"
        />
        <select
          aria-label="Filter by building"
          name="buildingId"
          value={filters.buildingId}
          onChange={handleFilterChange}
        >
          <option value="">All buildings</option>
          {buildings.map((building) => (
            <option key={building.id} value={building.id}>
              {building.buildingCode} - {building.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by status"
          name="status"
          value={filters.status}
          onChange={handleFilterChange}
        >
          <option value="">All statuses</option>
          {ROOM_STATUS_OPTIONS.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
        <button type="submit">Search</button>
        <button className="secondary-button inline-button" type="button" onClick={handleClearFilters}>
          Clear
        </button>
      </form>

      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading rooms...</div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Building</th>
                <th>Floor</th>
                <th>Price</th>
                <th>Status</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.id}>
                  <td>{room.roomCode}</td>
                  <td>{room.roomName}</td>
                  <td>{room.buildingCode}</td>
                  <td>{room.floor}</td>
                  <td>{formatNumber(room.price)}</td>
                  <td>
                    <span className={statusClass(room.status)}>{getRoomStatusLabel(room.status)}</span>
                  </td>
                  <td>
                    <Link className="secondary-link compact-link" to={`/staff/rooms/${room.id}`}>
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rooms.length === 0 && <div className="empty-state flat-empty-state">No rooms found.</div>}
        </div>
      )}
    </section>
  );
}
