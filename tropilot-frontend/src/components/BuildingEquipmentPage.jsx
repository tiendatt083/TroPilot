import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as equipmentApi from '../features/equipment/api.js';
import * as roomApi from '../features/rooms/api.js';
import EquipmentForm from './EquipmentForm.jsx';
import EquipmentMaintenancePanel from './EquipmentMaintenancePanel.jsx';
import EquipmentTable from './EquipmentTable.jsx';
import ActionDialog from './common/ActionDialog.jsx';
import LineIcon from './common/LineIcon.jsx';
import { EQUIPMENT_CONDITIONS, EQUIPMENT_SCOPES } from '../utils/equipmentOptions.js';
import { formatRoomLabel } from '../utils/roomDisplay.js';

const EMPTY_FILTERS = {
  search: '',
  scope: '',
  roomId: '',
  condition: ''
};

function normalizeSearchValue(value) {
  return String(value || '').trim().toLowerCase();
}

function equipmentMatchesSearch(item, searchValue) {
  if (!searchValue) {
    return true;
  }

  const searchableValues = [
    item.equipmentCode,
    item.name,
    item.buildingCode,
    item.buildingName,
    item.roomCode,
    item.roomName,
    item.locationDescription
  ];

  return searchableValues.some((value) => normalizeSearchValue(value).includes(searchValue));
}

function toEquipmentPayload(payload) {
  const { buildingId, ...equipmentPayload } = payload;
  return equipmentPayload;
}

function apiForRole(role) {
  if (role === 'admin') {
    return {
      list: equipmentApi.getAdminBuildingEquipment,
      rooms: roomApi.getAdminRooms,
      request: equipmentApi.requestAdminEquipmentMaintenance,
      history: equipmentApi.getAdminEquipmentHistory
    };
  }

  return {
    list: equipmentApi.getStaffBuildingEquipment,
    rooms: roomApi.getStaffRooms,
    request: equipmentApi.requestStaffEquipmentMaintenance,
    history: equipmentApi.getStaffEquipmentHistory
  };
}

export default function BuildingEquipmentPage({ role }) {
  const { t } = useTranslation();
  const { building } = useOutletContext();
  const api = useMemo(() => apiForRole(role), [role]);
  const canManage = role === 'admin';
  const [equipment, setEquipment] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [panel, setPanel] = useState({ type: '', equipment: null });
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const displayedEquipment = useMemo(() => {
    const searchValue = normalizeSearchValue(filters.search);
    return equipment.filter((item) => equipmentMatchesSearch(item, searchValue));
  }, [equipment, filters.search]);
  const sharedEquipment = displayedEquipment.filter((item) => item.scope === 'BUILDING');
  const roomEquipment = displayedEquipment.filter((item) => item.scope === 'ROOM');

  const loadData = async (activeFilters = filters) => {
    setError('');

    try {
      const [equipmentResponse, roomsResponse] = await Promise.all([
        api.list(building.id, activeFilters),
        api.rooms({ buildingId: building.id })
      ]);
      setEquipment(equipmentResponse.data);
      setRooms(roomsResponse.data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('equipment.messages.loadError'));
    }
  };

  useEffect(() => {
    setLoading(true);
    loadData(EMPTY_FILTERS).finally(() => setLoading(false));
  }, [building.id, api]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({
      ...current,
      [name]: value,
      ...(name === 'scope' && value !== 'ROOM' ? { roomId: '' } : {})
    }));
  };

  const handleApplyFilters = async (event) => {
    event.preventDefault();
    const activeFilters = {
      ...filters,
      search: filters.search.trim()
    };
    setFilters(activeFilters);
    setLoading(true);
    await loadData(activeFilters);
    setLoading(false);
  };

  const handleClearFilters = async () => {
    setFilters(EMPTY_FILTERS);
    setLoading(true);
    await loadData(EMPTY_FILTERS);
    setLoading(false);
  };

  const handleOpenForm = () => {
    setEditingEquipment(null);
    setPanel({ type: '', equipment: null });
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setEditingEquipment(null);
    setFormOpen(false);
  };

  const handleSave = async (payload) => {
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const equipmentPayload = toEquipmentPayload(payload);
      if (editingEquipment) {
        await equipmentApi.updateAdminEquipment(building.id, editingEquipment.id, equipmentPayload);
        setMessage(t('equipment.messages.updated'));
      } else {
        await equipmentApi.createAdminEquipment(building.id, equipmentPayload);
        setMessage(t('equipment.messages.created'));
      }

      setEditingEquipment(null);
      setFormOpen(false);
      await loadData();
    } catch (apiError) {
      setError(
        apiError.response?.data?.message
          || (editingEquipment ? t('equipment.messages.updateError') : t('equipment.messages.createError'))
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(t('equipment.messages.deleteConfirm', { name: item.name }))) {
      return;
    }

    setProcessingId(item.id);
    setMessage('');
    setError('');

    try {
      const response = await equipmentApi.deleteAdminEquipment(building.id, item.id);
      setMessage(
        response.data.deactivated
          ? t('equipment.messages.deactivatedInstead')
          : t('equipment.messages.deleted')
      );
      await loadData();
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('equipment.messages.deleteError'));
    } finally {
      setProcessingId(null);
    }
  };

  const openRequestPanel = (item) => {
    setPanel({ type: 'request', equipment: item });
    setHistory([]);
  };

  const openHistoryPanel = async (item) => {
    setPanel({ type: 'history', equipment: item });
    setHistory([]);
    setHistoryLoading(true);
    setError('');

    try {
      const response = await api.history(item.id);
      setHistory(response.data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('equipment.history.loadError'));
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleMaintenanceRequest = async (payload) => {
    setRequestLoading(true);
    setMessage('');
    setError('');

    try {
      await api.request(panel.equipment.id, payload);
      setMessage(t('equipment.request.created'));
      setPanel({ type: '', equipment: null });
      await loadData();
      return true;
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('equipment.request.createError'));
      return false;
    } finally {
      setRequestLoading(false);
    }
  };

  const renderActions = (item) => (
    <div className="table-actions icon-table-actions equipment-icon-actions">
      {canManage && (
        <>
          <button
            aria-label={t('common.edit')}
            className="icon-action-button"
            data-tooltip={t('common.edit')}
            type="button"
            disabled={processingId === item.id}
            onClick={() => {
              setEditingEquipment(item);
              setFormOpen(true);
              setPanel({ type: '', equipment: null });
            }}
          >
            <LineIcon name="edit" />
          </button>
          <button
            aria-label={t('common.delete')}
            className="icon-action-button icon-action-danger"
            data-tooltip={t('common.delete')}
            type="button"
            disabled={processingId === item.id}
            onClick={() => handleDelete(item)}
          >
            <LineIcon name="trash" />
          </button>
        </>
      )}
      {item.condition !== 'INACTIVE' && (
        <button
          aria-label={t('equipment.actions.requestMaintenance')}
          className="icon-action-button"
          data-tooltip={t('equipment.actions.requestMaintenance')}
          type="button"
          onClick={() => openRequestPanel(item)}
        >
          <LineIcon name="tool" />
        </button>
      )}
      <button
        aria-label={t('equipment.actions.viewHistory')}
        className="icon-action-button"
        data-tooltip={t('equipment.actions.viewHistory')}
        type="button"
        onClick={() => openHistoryPanel(item)}
      >
        <LineIcon name="clock" />
      </button>
    </div>
  );

  return (
    <div className="building-workspace equipment-page">
      <div className="page-title-row compact-title-row">
        <span className="page-eyebrow">{t('equipment.eyebrow')}</span>
        {canManage && (
          <div className="page-action-row">
            <button className="button-link" type="button" onClick={handleOpenForm}>
              {t('equipment.actions.add')}
            </button>
          </div>
        )}
      </div>

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {canManage && (
        <ActionDialog
          className="action-dialog-wide"
          eyebrow={editingEquipment ? t('equipment.form.editEyebrow') : t('equipment.form.addEyebrow')}
          labelledBy="equipment-form-dialog-title"
          open={formOpen}
          title={editingEquipment ? t('equipment.form.editTitle') : t('equipment.form.addTitle')}
          onClose={handleCloseForm}
        >
          <EquipmentForm
            equipment={editingEquipment}
            rooms={rooms}
            fixedBuilding={building}
            saving={saving}
            onSubmit={handleSave}
            onCancel={handleCloseForm}
            showCancel
          />
        </ActionDialog>
      )}

      <section className="building-section">
        <form className="equipment-filter-row building-equipment-filter-row" onSubmit={handleApplyFilters}>
          <input
            aria-label={t('equipment.filters.searchAria')}
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder={t('equipment.filters.searchPlaceholder')}
          />
          <div>
            <select
              id="equipmentScopeFilter"
              aria-label={t('equipment.filters.scope')}
              name="scope"
              value={filters.scope}
              onChange={handleFilterChange}
            >
              <option value="">{t('equipment.filters.allScopes')}</option>
              {EQUIPMENT_SCOPES.map((scope) => (
                <option key={scope} value={scope}>
                  {t(`equipment.scopes.${scope}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              id="equipmentRoomFilter"
              aria-label={t('equipment.filters.room')}
              name="roomId"
              value={filters.roomId}
              disabled={filters.scope !== 'ROOM'}
              onChange={handleFilterChange}
            >
              <option value="">{t('equipment.filters.allRooms')}</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {formatRoomLabel(room)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              id="equipmentConditionFilter"
              aria-label={t('equipment.filters.condition')}
              name="condition"
              value={filters.condition}
              onChange={handleFilterChange}
            >
              <option value="">{t('equipment.filters.allConditions')}</option>
              {EQUIPMENT_CONDITIONS.map((condition) => (
                <option key={condition} value={condition}>
                  {t(`equipment.conditions.${condition}`)}
                </option>
              ))}
            </select>
          </div>
          <button type="submit">{t('common.filter')}</button>
          <button className="secondary-button inline-button" type="button" onClick={handleClearFilters}>
            {t('common.clear')}
          </button>
        </form>

        {loading ? (
          <div className="empty-state">{t('equipment.messages.loading')}</div>
        ) : (
          <div className="equipment-record-groups">
            <div>
              <h3>{t('equipment.records.sharedTitle')}</h3>
              <EquipmentTable equipment={sharedEquipment} renderActions={renderActions} />
            </div>
            <div>
              <h3>{t('equipment.records.roomTitle')}</h3>
              <EquipmentTable equipment={roomEquipment} renderActions={renderActions} />
            </div>
          </div>
        )}
      </section>

      <EquipmentMaintenancePanel
        equipment={panel.equipment}
        history={history}
        historyLoading={historyLoading}
        requestLoading={requestLoading}
        showHistory={panel.type === 'history'}
        onClose={() => setPanel({ type: '', equipment: null })}
        onSubmit={handleMaintenanceRequest}
      />
    </div>
  );
}
