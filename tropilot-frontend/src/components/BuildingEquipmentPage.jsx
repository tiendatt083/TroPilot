import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as equipmentApi from '../features/equipment/api.js';
import * as roomApi from '../features/rooms/api.js';
import EquipmentForm from './EquipmentForm.jsx';
import EquipmentMaintenancePanel from './EquipmentMaintenancePanel.jsx';
import EquipmentTable from './EquipmentTable.jsx';
import PageHeader from './PageHeader.jsx';
import { EQUIPMENT_CONDITIONS, EQUIPMENT_SCOPES } from '../utils/equipmentOptions.js';
import { formatRoomLabel } from '../utils/roomDisplay.js';

const EMPTY_FILTERS = {
  scope: '',
  roomId: '',
  condition: ''
};

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
  const sharedEquipment = equipment.filter((item) => item.scope === 'BUILDING');
  const roomEquipment = equipment.filter((item) => item.scope === 'ROOM');

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
    setLoading(true);
    await loadData(filters);
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
    <div className="table-actions">
      {canManage && (
        <>
          <button
            className="secondary-button compact-button"
            type="button"
            disabled={processingId === item.id}
            onClick={() => {
              setEditingEquipment(item);
              setFormOpen(true);
              setPanel({ type: '', equipment: null });
            }}
          >
            {t('common.edit')}
          </button>
          <button
            className="danger-button compact-button"
            type="button"
            disabled={processingId === item.id}
            onClick={() => handleDelete(item)}
          >
            {t('common.delete')}
          </button>
        </>
      )}
      {item.condition !== 'INACTIVE' && (
        <button
          className="secondary-button compact-button"
          type="button"
          onClick={() => openRequestPanel(item)}
        >
          {t('equipment.actions.requestMaintenance')}
        </button>
      )}
      <button
        className="secondary-button compact-button"
        type="button"
        onClick={() => openHistoryPanel(item)}
      >
        {t('equipment.actions.viewHistory')}
      </button>
    </div>
  );

  return (
    <div className="building-workspace equipment-page">
      <PageHeader
        eyebrow={t('equipment.eyebrow')}
        title={t('equipment.title')}
        actions={
          canManage && !formOpen && (
            <button className="button-link" type="button" onClick={handleOpenForm}>
              {t('equipment.actions.add')}
            </button>
          )
        }
      />
      <p className="page-support-text">
        {canManage ? t('equipment.adminDescription') : t('equipment.staffDescription')}
      </p>

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {canManage && formOpen && (
        <section className="building-section equipment-editor-section">
          <PageHeader
            eyebrow={editingEquipment ? t('equipment.form.editEyebrow') : t('equipment.form.addEyebrow')}
            title={editingEquipment ? t('equipment.form.editTitle') : t('equipment.form.addTitle')}
          />
          <EquipmentForm
            equipment={editingEquipment}
            rooms={rooms}
            fixedBuilding={building}
            saving={saving}
            onSubmit={handleSave}
            onCancel={handleCloseForm}
            showCancel
          />
        </section>
      )}

      <section className="building-section">
        <div className="building-section-header">
          <PageHeader eyebrow={t('equipment.records.eyebrow')} title={t('equipment.records.title')} />
        </div>

        <form className="equipment-filter-row" onSubmit={handleApplyFilters}>
          <div>
            <label htmlFor="equipmentScopeFilter">{t('equipment.filters.scope')}</label>
            <select
              id="equipmentScopeFilter"
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
            <label htmlFor="equipmentRoomFilter">{t('equipment.filters.room')}</label>
            <select
              id="equipmentRoomFilter"
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
            <label htmlFor="equipmentConditionFilter">{t('equipment.filters.condition')}</label>
            <select
              id="equipmentConditionFilter"
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
