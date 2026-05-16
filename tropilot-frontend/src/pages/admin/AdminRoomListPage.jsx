import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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

function filtersFromSearchParams(searchParams) {
  return {
    search: searchParams.get('search') || '',
    buildingId: searchParams.get('buildingId') || '',
    status: searchParams.get('status') || ''
  };
}

function toSearchParams(filters) {
  const params = new URLSearchParams();

  if (filters.search) {
    params.set('search', filters.search);
  }

  if (filters.buildingId) {
    params.set('buildingId', filters.buildingId);
  }

  if (filters.status) {
    params.set('status', filters.status);
  }

  return params;
}

export default function AdminRoomListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFilters = filtersFromSearchParams(searchParams);
  const [rooms, setRooms] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const loadRooms = async (filterValues = appliedFilters) => {
    setLoading(true);
    setError('');

    try {
      const response = await roomApi.getAdminRooms(filterValues);
      setRooms(response.data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Rooms could not be loaded');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    buildingApi
      .getAdminBuildings()
      .then((response) => setBuildings(response.data))
      .catch((apiError) => setError(apiError.response?.data?.message || 'Buildings could not be loaded'));
    loadRooms(initialFilters);
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
    setSearchParams(toSearchParams(nextFilters));
    loadRooms(nextFilters);
  };

  const handleClearFilters = () => {
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setSearchParams(new URLSearchParams());
    loadRooms(emptyFilters);
  };

  const handleDelete = async (room) => {
    const confirmed = window.confirm(`Delete room ${room.roomCode}?`);
    if (!confirmed) {
      return;
    }

    setDeletingId(room.id);
    setMessage('');
    setError('');

    try {
      await roomApi.deleteAdminRoom(room.id);
      setMessage('Room deleted successfully.');
      await loadRooms(appliedFilters);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Room could not be deleted');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="content-section">
      <div className="page-title-row">
        <PageHeader eyebrow="Administrator" title="Room management" />
        <Link className="button-link" to="/admin/rooms/create">
          Create room
        </Link>
      </div>

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

      {message && <div className="alert success-alert">{message}</div>}
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
                <th>Actions</th>
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
                    <div className="table-actions">
                      <Link className="secondary-link compact-link" to={`/admin/rooms/${room.id}`}>
                        View
                      </Link>
                      <Link className="secondary-link compact-link" to={`/admin/rooms/${room.id}/edit`}>
                        Edit
                      </Link>
                      <button
                        className="secondary-button compact-button"
                        type="button"
                        disabled={deletingId === room.id}
                        onClick={() => handleDelete(room)}
                      >
                        Delete
                      </button>
                    </div>
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
