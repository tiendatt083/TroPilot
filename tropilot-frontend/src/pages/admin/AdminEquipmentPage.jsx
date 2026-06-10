import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as buildingApi from '../../api/buildingApi.js';
import * as equipmentApi from '../../api/equipmentApi.js';
import * as roomApi from '../../api/roomApi.js';
import EquipmentForm from '../../components/EquipmentForm.jsx';
import EquipmentMaintenancePanel from '../../components/EquipmentMaintenancePanel.jsx';
import EquipmentTable from '../../components/EquipmentTable.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { EQUIPMENT_CONDITIONS, EQUIPMENT_SCOPES } from '../../utils/equipmentOptions.js';
import { formatRoomLabel } from '../../utils/roomDisplay.js';

const EMPTY_FILTERS = {
  buildingId: '',
  scope: '',
  roomId: '',
  condition: ''
};

function stripFormOnlyFields(payload) {
  const { buildingId, ...equipmentPayload } = payload;
  return equipmentPayload;
}

export default function AdminEquipmentPage() {
  const { t } = useTranslation();
  const [equipment, setEquipment] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [panel, setPanel] = useState({ type: '', equipment: null });
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);

  const filteredRooms = useMemo(() => {
    if (!filters.buildingId) {
      return [];
    }

    return rooms.filter((room) => !room.buildingId || String(room.buildingId) === filters.buildingId);
  }, [filters.buildingId, rooms]);

  const sharedEquipment = equipment.filter((item) => item.scope === 'BUILDING');
  const roomEquipment = equipment.filter((item) => item.scope === 'ROOM');

  const loadData = async (activeFilters = filters) => {
    setError('');

    try {
      const [equipmentResponse, buildingResponse, roomResponse] = await Promise.all([
        equipmentApi.getAdminEquipment(activeFilters),
        buildingApi.getAdminBuildings(''),
        roomApi.getAdminRooms({})
      ]);

      setEquipment(equipmentResponse.data);
      setBuildings(buildingResponse.data);
      setRooms(roomResponse.data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('equipment.messages.loadError'));
    }
  };

  useEffect(() => {
    loadData(EMPTY_FILTERS).finally(() => setLoading(false));
  }, []);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((current) => ({
      ...current,
      [name]: value,
      ...(name === 'buildingId' ? { roomId: '' } : {}),
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

  const handleSave = async (payload) => {
    const buildingId = editingEquipment?.buildingId || payload.buildingId;

    if (!buildingId) {
      setError(t('equipment.messages.buildingRequired'));
      return;
    }

    setSaving(true);
    setMessage('');
    setError('');

    try {
      const equipmentPayload = stripFormOnlyFields(payload);

      if (editingEquipment) {
        await equipmentApi.updateAdminEquipment(buildingId, editingEquipment.id, equipmentPayload);
        setMessage(t('equipment.messages.updated'));
      } else {
        await equipmentApi.createAdminEquipment(buildingId, equipmentPayload);
        setMessage(t('equipment.messages.created'));
      }

      setEditingEquipment(null);
      await loadData(filters);
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
      const response = await equipmentApi.deleteAdminEquipment(item.buildingId, item.id);
      setMessage(
        response.data.deactivated
          ? t('equipment.messages.deactivatedInstead')
          : t('equipment.messages.deleted')
      );
      await loadData(filters);
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
      const response = await equipmentApi.getAdminEquipmentHistory(item.id);
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
      await equipmentApi.requestAdminEquipmentMaintenance(panel.equipment.id, payload);
      setMessage(t('equipment.request.created'));
      setPanel({ type: '', equipment: null });
      await loadData(filters);
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
      <button
        className="secondary-button compact-button"
        type="button"
        disabled={processingId === item.id}
        onClick={() => {
          setEditingEquipment(item);
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
    <div className="equipment-page">
      <PageHeader eyebrow={t('equipment.globalEyebrow')} title={t('equipment.globalTitle')} />
      <p className="page-support-text">{t('equipment.adminGlobalDescription')}</p>

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      <section className="building-section">
        <PageHeader
          eyebrow={editingEquipment ? t('equipment.form.editEyebrow') : t('equipment.form.addEyebrow')}
          title={editingEquipment ? t('equipment.form.editTitle') : t('equipment.form.addTitle')}
        />
        <EquipmentForm
          equipment={editingEquipment}
          buildings={buildings}
          rooms={rooms}
          saving={saving}
          onSubmit={handleSave}
          onCancel={() => setEditingEquipment(null)}
        />
      </section>

      <section className="building-section">
        <PageHeader eyebrow={t('equipment.records.eyebrow')} title={t('equipment.records.title')} />

        <form className="equipment-filter-row admin-equipment-filter-row" onSubmit={handleApplyFilters}>
          <div>
            <label htmlFor="equipmentBuildingFilter">{t('equipment.filters.building')}</label>
            <select
              id="equipmentBuildingFilter"
              name="buildingId"
              value={filters.buildingId}
              onChange={handleFilterChange}
            >
              <option value="">{t('equipment.filters.allBuildings')}</option>
              {buildings.map((building) => (
                <option key={building.id} value={building.id}>
                  {building.buildingCode} - {building.name}
                </option>
              ))}
            </select>
          </div>
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
              disabled={!filters.buildingId || filters.scope !== 'ROOM'}
              onChange={handleFilterChange}
            >
              <option value="">{t('equipment.filters.allRooms')}</option>
              {filteredRooms.map((room) => (
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
