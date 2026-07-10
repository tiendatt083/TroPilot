import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import * as buildingApi from '../../features/buildings/api.js';
import * as roomApi from '../../features/rooms/api.js';
import PageHeader from '../../components/PageHeader.jsx';
import RoomForm from '../../components/RoomForm.jsx';
import ActionDialog from '../../components/common/ActionDialog.jsx';
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
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFilters = filtersFromSearchParams(searchParams);
  const [rooms, setRooms] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingForm, setSavingForm] = useState(false);
  const [formError, setFormError] = useState('');
  const [activeForm, setActiveForm] = useState({ mode: '', room: null });
  const [deletingId, setDeletingId] = useState(null);

  const loadRooms = async (filterValues = appliedFilters) => {
    setLoading(true);
    setError('');

    try {
      const response = await roomApi.getAdminRooms(filterValues);
      setRooms(response.data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('roomManagement.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    buildingApi
      .getAdminBuildings()
      .then((response) => setBuildings(response.data))
      .catch((apiError) => setError(apiError.response?.data?.message || t('roomManagement.buildingsLoadError')));
    loadRooms(initialFilters);
  }, []);

  useEffect(() => {
    const nextFilters = {
      ...filters,
      search: filters.search.trim()
    };
    const timer = window.setTimeout(() => {
      setAppliedFilters(nextFilters);
      setSearchParams(toSearchParams(nextFilters), { replace: true });
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
    setSearchParams(new URLSearchParams());
    loadRooms(emptyFilters);
  };

  const handleDelete = async (room) => {
    const confirmed = window.confirm(t('roomManagement.deleteConfirm', { room: formatRoomCode(room) }));
    if (!confirmed) {
      return;
    }

    setDeletingId(room.id);
    setMessage('');
    setError('');

    try {
      await roomApi.deleteAdminRoom(room.id);
      setMessage(t('roomManagement.deleted'));
      await loadRooms(appliedFilters);
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('roomManagement.deleteError'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenCreate = () => {
    setFormError('');
    setActiveForm({ mode: 'create', room: null });
  };

  const handleOpenEdit = (room) => {
    setFormError('');
    setActiveForm({ mode: 'edit', room });
  };

  const handleCloseForm = () => {
    if (savingForm) {
      return;
    }

    setActiveForm({ mode: '', room: null });
    setFormError('');
  };

  const handleSaveRoom = async (payload) => {
    setSavingForm(true);
    setFormError('');
    setMessage('');
    setError('');

    try {
      if (activeForm.mode === 'edit') {
        await roomApi.updateAdminRoom(activeForm.room.id, payload);
        setMessage(t('roomManagement.updated'));
      } else {
        await roomApi.createAdminRoom(payload);
        setMessage(t('roomManagement.created'));
      }

      setActiveForm({ mode: '', room: null });
      await loadRooms(appliedFilters);
    } catch (apiError) {
      setFormError(
        apiError.response?.data?.message
          || (activeForm.mode === 'edit' ? t('roomManagement.updateError') : t('roomManagement.createError'))
      );
    } finally {
      setSavingForm(false);
    }
  };

  return (
    <section className="content-section">
      <div className="page-title-row">
        <PageHeader eyebrow={t('role.admin')} title={t('roomManagement.adminTitle')} />
        <button className="button-link" type="button" onClick={handleOpenCreate}>
          {t('roomManagement.create')}
        </button>
      </div>

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

      {message && <div className="alert success-alert">{message}</div>}
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
                <th>{t('tables.common.actions')}</th>
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
                    <div className="table-actions">
                      <Link className="secondary-link compact-link" to={`/admin/rooms/${room.id}`}>
                        {t('common.view')}
                      </Link>
                      <button className="secondary-button compact-button" type="button" onClick={() => handleOpenEdit(room)}>
                        {t('common.edit')}
                      </button>
                      <button
                        className="secondary-button compact-button"
                        type="button"
                        disabled={deletingId === room.id}
                        onClick={() => handleDelete(room)}
                      >
                        {t('common.delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rooms.length === 0 && <div className="empty-state flat-empty-state">{t('roomManagement.empty')}</div>}
        </div>
      )}

      <ActionDialog
        className="action-dialog-wide"
        eyebrow={t('role.admin')}
        labelledBy="room-form-dialog-title"
        open={Boolean(activeForm.mode)}
        title={activeForm.mode === 'edit' ? t('roomManagement.editTitle') : t('roomManagement.createTitle')}
        onClose={handleCloseForm}
      >
        {formError && <div className="alert error-alert">{formError}</div>}
        <RoomForm
          buildingOptions={buildings}
          initialValues={activeForm.mode === 'edit' ? activeForm.room : undefined}
          loading={savingForm}
          submitLabel={activeForm.mode === 'edit' ? t('roomManagement.saveChanges') : t('roomManagement.create')}
          onSubmit={handleSaveRoom}
        />
      </ActionDialog>
    </section>
  );
}
