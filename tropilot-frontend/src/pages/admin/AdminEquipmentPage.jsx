import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as buildingApi from '../../features/buildings/api.js';
import * as equipmentApi from '../../features/equipment/api.js';
import { EquipmentForm, EquipmentMaintenancePanel, EquipmentTable } from '../../features/equipment/components/index.js';
import * as roomApi from '../../features/rooms/api.js';
import PageHeader from '../../components/PageHeader.jsx';
import FilterBar from '../../components/common/FilterBar.jsx';
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

  useEffect(() => {
    setLoading(true);
    loadData(filters).finally(() => setLoading(false));
  }, [filters]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((current) => ({
      ...current,
      [name]: value,
      ...(name === 'buildingId' ? { roomId: '' } : {}),
      ...(name === 'scope' && value !== 'ROOM' ? { roomId: '' } : {})
    }));
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

        <FilterBar
          as="div"
          className="equipment-filter-row admin-equipment-filter-row"
          filters={[
            {
              name: 'buildingId',
              value: filters.buildingId,
              ariaLabel: t('equipment.filters.building'),
              onChange: (value) => handleFilterChange({ target: { name: 'buildingId', value } }),
              options: [
                { value: '', label: t('equipment.filters.allBuildings') },
                ...buildings.map((building) => ({
                  value: String(building.id),
                  label: `${building.buildingCode} - ${building.name}`
                }))
              ]
            },
            {
              name: 'scope',
              value: filters.scope,
              ariaLabel: t('equipment.filters.scope'),
              onChange: (value) => handleFilterChange({ target: { name: 'scope', value } }),
              options: [
                { value: '', label: t('equipment.filters.allScopes') },
                ...EQUIPMENT_SCOPES.map((scope) => ({
                  value: scope,
                  label: t(`equipment.scopes.${scope}`)
                }))
              ]
            },
            {
              name: 'roomId',
              value: filters.roomId,
              disabled: !filters.buildingId || filters.scope !== 'ROOM',
              ariaLabel: t('equipment.filters.room'),
              onChange: (value) => handleFilterChange({ target: { name: 'roomId', value } }),
              options: [
                { value: '', label: t('equipment.filters.allRooms') },
                ...filteredRooms.map((room) => ({
                  value: String(room.id),
                  label: formatRoomLabel(room)
                }))
              ]
            },
            {
              name: 'condition',
              value: filters.condition,
              ariaLabel: t('equipment.filters.condition'),
              onChange: (value) => handleFilterChange({ target: { name: 'condition', value } }),
              options: [
                { value: '', label: t('equipment.filters.allConditions') },
                ...EQUIPMENT_CONDITIONS.map((condition) => ({
                  value: condition,
                  label: t(`equipment.conditions.${condition}`)
                }))
              ]
            }
          ]}
          clearLabel={t('common.clear')}
          onClear={handleClearFilters}
        />

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
