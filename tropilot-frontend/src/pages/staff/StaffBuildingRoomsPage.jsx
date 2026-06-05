import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import * as roomApi from '../../api/roomApi.js';
import PageHeader from '../../components/PageHeader.jsx';
import { formatNumber } from '../../utils/numberFormat.js';
import { formatRoomCode } from '../../utils/roomDisplay.js';
import { getRoomStatusLabel } from '../../utils/roomStatusOptions.js';

const emptyFilters = {
  search: '',
  status: ''
};

function statusClass(status) {
  return `status-pill room-status-${status.toLowerCase()}`;
}

export default function StaffBuildingRoomsPage() {
  const { building } = useOutletContext();
  const [rooms, setRooms] = useState([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadRooms = async (filterValues = appliedFilters) => {
    setLoading(true);
    setError('');

    try {
      const response = await roomApi.getStaffRooms({
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

  const handleSearch = (event) => {
    event.preventDefault();
    const nextFilters = { ...filters, search: filters.search.trim() };
    setAppliedFilters(nextFilters);
    loadRooms(nextFilters);
  };

  const handleClearFilters = () => {
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    loadRooms(emptyFilters);
  };

  return (
    <div className="building-workspace">
      <PageHeader eyebrow="Building rooms" title="Rooms in this building" />

      <form className="building-filter-row" onSubmit={handleSearch}>
        <input
          aria-label="Search rooms in this building"
          name="search"
          value={filters.search}
          onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
          placeholder="Search by code or name"
        />
        <select
          aria-label="Filter rooms by status"
          name="status"
          value={filters.status}
          onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
        >
          <option value="">All statuses</option>
          <option value="EMPTY">Empty</option>
          <option value="OCCUPIED">Occupied</option>
          <option value="MAINTENANCE">Maintenance</option>
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
                <th>Floor</th>
                <th>Price</th>
                <th>Area</th>
                <th>Max occupants</th>
                <th>Status</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.id}>
                  <td>{formatRoomCode(room)}</td>
                  <td>{room.roomName}</td>
                  <td>{room.floor}</td>
                  <td>{formatNumber(room.price)}</td>
                  <td>{formatNumber(room.area)}</td>
                  <td>{room.maxOccupants}</td>
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
    </div>
  );
}
