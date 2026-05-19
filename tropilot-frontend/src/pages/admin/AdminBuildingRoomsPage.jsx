import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import * as roomApi from '../../api/roomApi.js';
import PageHeader from '../../components/PageHeader.jsx';
import { ROOM_STATUS_OPTIONS, getRoomStatusLabel } from '../../utils/roomStatusOptions.js';

const emptyFilters = {
  search: '',
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

export default function AdminBuildingRoomsPage() {
  const { building } = useOutletContext();
  const [rooms, setRooms] = useState([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const loadRooms = async (filterValues = appliedFilters) => {
    setLoading(true);
    setError('');

    try {
      const response = await roomApi.getAdminRooms({
        buildingId: building.id,
        search: filterValues.search,
        status: filterValues.status
      });
      setRooms(response.data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Building rooms could not be loaded');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms(emptyFilters);
  }, [building.id]);

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
    <div className="building-workspace">
      <div className="building-section-header">
        <PageHeader eyebrow="Building rooms" title="Rooms in this building" />
        <Link className="button-link" to={`/admin/rooms/create?buildingId=${building.id}`}>
          Create room
        </Link>
      </div>

      <form className="building-filter-row" onSubmit={handleSearch}>
        <input
          aria-label="Search rooms in this building"
          name="search"
          value={filters.search}
          onChange={handleFilterChange}
          placeholder="Search by code or name"
        />
        <select
          aria-label="Filter rooms by status"
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
                <th>Floor</th>
                <th>Price</th>
                <th>Area</th>
                <th>Max occupants</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.id}>
                  <td>{room.roomCode}</td>
                  <td>{room.roomName}</td>
                  <td>{room.floor}</td>
                  <td>{formatNumber(room.price)}</td>
                  <td>{formatNumber(room.area)}</td>
                  <td>{room.maxOccupants}</td>
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
                      <Link className="secondary-link compact-link" to={`/admin/rooms/${room.id}/members`}>
                        Members
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
    </div>
  );
}
