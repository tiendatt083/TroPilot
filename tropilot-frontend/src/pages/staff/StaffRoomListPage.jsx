import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import * as buildingApi from '../../features/buildings/api.js';
import * as roomApi from '../../features/rooms/api.js';
import PageHeader from '../../components/PageHeader.jsx';
import { formatRoomCode } from '../../utils/roomDisplay.js';
import { ROOM_STATUS_OPTIONS } from '../../utils/roomStatusOptions.js';
import { formatEnumLabel } from '../../utils/i18nFormat.js';

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
  const { t } = useTranslation();
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
      setError(apiError.response?.data?.message || t('roomManagement.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    buildingApi
      .getStaffBuildings()
      .then((response) => setBuildings(response.data))
      .catch((apiError) => setError(apiError.response?.data?.message || t('roomManagement.buildingsLoadError')));
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
      <PageHeader eyebrow={t('role.staff')} title={t('roomManagement.staffTitle')} />

      <form className="filter-row" onSubmit={handleSearch}>
        <input
          aria-label={t('roomManagement.searchAria')}
          name="search"
          value={filters.search}
          onChange={handleFilterChange}
          placeholder={t('roomManagement.searchPlaceholder')}
        />
        <select
          aria-label={t('roomManagement.buildingFilterAria')}
          name="buildingId"
          value={filters.buildingId}
          onChange={handleFilterChange}
        >
          <option value="">{t('roomManagement.allBuildings')}</option>
          {buildings.map((building) => (
            <option key={building.id} value={building.id}>
              {building.buildingCode} - {building.name}
            </option>
          ))}
        </select>
        <select
          aria-label={t('roomManagement.statusFilterAria')}
          name="status"
          value={filters.status}
          onChange={handleFilterChange}
        >
          <option value="">{t('roomManagement.allStatuses')}</option>
          {ROOM_STATUS_OPTIONS.map((status) => (
            <option key={status.value} value={status.value}>
              {formatEnumLabel(t, 'roomStatus', status.value)}
            </option>
          ))}
        </select>
        <button type="submit">{t('common.search')}</button>
        <button className="secondary-button inline-button" type="button" onClick={handleClearFilters}>
          {t('common.clear')}
        </button>
      </form>

      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">{t('roomManagement.loading')}</div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('tables.common.code')}</th>
                <th>{t('tables.common.name')}</th>
                <th>{t('tables.common.building')}</th>
                <th>{t('tables.common.floor')}</th>
                <th>{t('tables.common.price')}</th>
                <th>{t('tables.common.status')}</th>
                <th>{t('common.details')}</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.id}>
                  <td>{formatRoomCode(room)}</td>
                  <td>{room.roomName}</td>
                  <td>{room.buildingCode}</td>
                  <td>{room.floor}</td>
                  <td>{formatNumber(room.price)}</td>
                  <td>
                    <span className={statusClass(room.status)}>{formatEnumLabel(t, 'roomStatus', room.status)}</span>
                  </td>
                  <td>
                    <Link className="secondary-link compact-link" to={`/staff/rooms/${room.id}`}>
                      {t('common.view')}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rooms.length === 0 && <div className="empty-state flat-empty-state">{t('roomManagement.empty')}</div>}
        </div>
      )}
    </section>
  );
}
