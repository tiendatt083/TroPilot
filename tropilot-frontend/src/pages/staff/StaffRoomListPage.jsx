import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import * as buildingApi from '../../api/buildingApi.js';
import * as roomApi from '../../api/roomApi.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import FilterBar from '../../components/common/FilterBar.jsx';
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

  useEffect(() => {
    const nextFilters = {
      ...filters,
      search: filters.search.trim()
    };
    const timer = window.setTimeout(() => {
      setAppliedFilters(nextFilters);
      loadRooms(nextFilters);
    }, filters.search ? 250 : 0);

    return () => window.clearTimeout(timer);
  }, [filters]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handleClearFilters = () => {
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    loadRooms(emptyFilters);
  };

  return (
    <section className="content-section">
      <PageHeader eyebrow={t('role.staff')} title={t('roomManagement.staffTitle')} />

      <FilterBar
        as="div"
        className="filter-row"
        searchAriaLabel={t('roomManagement.searchAria')}
        searchPlaceholder={t('roomManagement.searchPlaceholder')}
        searchValue={filters.search}
        suggestionFields={['roomCode', 'roomName', 'buildingCode', 'buildingName']}
        suggestionItems={rooms}
        filters={[
          {
            name: 'buildingId',
            value: filters.buildingId,
            ariaLabel: t('roomManagement.buildingFilterAria'),
            onChange: (value) => handleFilterChange({ target: { name: 'buildingId', value } }),
            options: [
              { value: '', label: t('roomManagement.allBuildings') },
              ...buildings.map((building) => ({
                value: String(building.id),
                label: `${building.buildingCode} - ${building.name}`
              }))
            ]
          },
          {
            name: 'status',
            value: filters.status,
            ariaLabel: t('roomManagement.statusFilterAria'),
            onChange: (value) => handleFilterChange({ target: { name: 'status', value } }),
            options: [
              { value: '', label: t('roomManagement.allStatuses') },
              ...ROOM_STATUS_OPTIONS.map((status) => ({
                value: status.value,
                label: formatEnumLabel(t, 'roomStatus', status.value)
              }))
            ]
          }
        ]}
        clearLabel={t('common.clear')}
        onClear={handleClearFilters}
        onSearchChange={(value) => handleFilterChange({ target: { name: 'search', value } })}
      />

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
                <th className="room-actions-column">{t('tables.common.actions')}</th>
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
                  <td className="room-actions-cell">
                    <div className="table-actions">
                      <Link className="secondary-link compact-link" to={`/staff/rooms/${room.id}`}>
                        {t('common.view')}
                      </Link>
                    </div>
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
