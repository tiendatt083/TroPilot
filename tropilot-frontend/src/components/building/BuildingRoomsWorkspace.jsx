import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useOutletContext } from 'react-router-dom';
import PageHeader from '../PageHeader.jsx';
import { formatNumber } from '../../utils/numberFormat.js';
import { formatRoomCode } from '../../utils/roomDisplay.js';
import { ROOM_STATUS_OPTIONS } from '../../utils/roomStatusOptions.js';
import { formatEnumLabel } from '../../utils/i18nFormat.js';

const emptyFilters = {
  search: '',
  status: ''
};

function statusClass(status) {
  return `status-pill room-status-${status.toLowerCase()}`;
}

export default function BuildingRoomsWorkspace({
  getRooms,
  roomBasePath,
  canManage = false,
  createRoomPath
}) {
  const { t } = useTranslation();
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
      const response = await getRooms({
        buildingId: building.id,
        search: filterValues.search,
        status: filterValues.status
      });
      setRooms(response.data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('workspace.rooms.loadError'));
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
      <div className="building-section-header">
        <PageHeader eyebrow={t('workspace.rooms.eyebrow')} title={t('workspace.rooms.title')} />
        {canManage && createRoomPath && (
          <Link className="button-link" to={`${createRoomPath}?buildingId=${building.id}`}>
            {t('workspace.rooms.create')}
          </Link>
        )}
      </div>

      <form className="building-filter-row" onSubmit={handleSearch}>
        <input
          aria-label={t('workspace.rooms.searchAria')}
          name="search"
          value={filters.search}
          onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
          placeholder={t('workspace.rooms.searchPlaceholder')}
        />
        <select
          aria-label={t('workspace.rooms.statusAria')}
          name="status"
          value={filters.status}
          onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
        >
          <option value="">{t('workspace.rooms.allStatuses')}</option>
          {ROOM_STATUS_OPTIONS.map((status) => (
            <option key={status.value} value={status.value}>
              {formatEnumLabel(t, 'roomStatus', status.value)}
            </option>
          ))}
        </select>
        <button type="submit">{t('common.filter')}</button>
        <button className="secondary-button inline-button" type="button" onClick={handleClearFilters}>
          {t('common.clear')}
        </button>
      </form>

      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">{t('workspace.rooms.loading')}</div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('tables.common.code')}</th>
                <th>{t('tables.common.name')}</th>
                <th>{t('tables.common.floor')}</th>
                <th>{t('tables.common.price')}</th>
                <th>{t('tables.common.area')}</th>
                <th>{t('workspace.rooms.maxOccupants')}</th>
                <th>{t('tables.common.status')}</th>
                <th>{canManage ? t('tables.common.actions') : t('workspace.rooms.details')}</th>
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
                    <span className={statusClass(room.status)}>{formatEnumLabel(t, 'roomStatus', room.status)}</span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <Link className="secondary-link compact-link" to={`${roomBasePath}/${room.id}`}>
                        {canManage ? t('workspace.rooms.manage') : t('common.view')}
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rooms.length === 0 && (
            <div className="empty-state flat-empty-state">{t('workspace.rooms.empty')}</div>
          )}
        </div>
      )}
    </div>
  );
}
