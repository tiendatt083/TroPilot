import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatEnumLabel } from '../utils/i18nFormat.js';
import { buildFullRoomCode, stripRoomCodePrefix } from '../utils/roomDisplay.js';
import { ROOM_STATUS_OPTIONS } from '../utils/roomStatusOptions.js';

const emptyForm = {
  buildingId: '',
  roomCode: '',
  roomName: '',
  floor: '1',
  price: '0',
  area: '0',
  maxOccupants: '1',
  status: 'EMPTY',
  description: ''
};

const editableRoomStatuses = new Set(['EMPTY', 'OCCUPIED']);

export default function RoomForm({
  buildingOptions,
  initialValues,
  loading,
  submitLabel,
  onSubmit,
  lockBuilding = false,
  lockOccupiedStatus = false
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    const initialStatus = lockOccupiedStatus ? 'OCCUPIED' : initialValues?.status;

    setForm({
      ...emptyForm,
      ...initialValues,
      buildingId: initialValues?.buildingId ? String(initialValues.buildingId) : '',
      roomCode: stripRoomCodePrefix(initialValues?.roomCode, initialValues?.buildingCode),
      floor: initialValues?.floor ? String(initialValues.floor) : '1',
      price: initialValues?.price !== undefined ? String(initialValues.price) : '0',
      area: initialValues?.area !== undefined ? String(initialValues.area) : '0',
      maxOccupants: initialValues?.maxOccupants ? String(initialValues.maxOccupants) : '1',
      status: editableRoomStatuses.has(initialStatus) ? initialStatus : 'EMPTY'
    });
  }, [initialValues, lockOccupiedStatus]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === 'buildingId' && lockBuilding) {
      return;
    }

    setForm((current) => {
      const currentBuilding = getSelectedBuilding(buildingOptions, current.buildingId);
      const nextValue =
        name === 'roomCode'
          ? stripRoomCodePrefix(value, currentBuilding?.buildingCode)
          : value;

      return {
        ...current,
        [name]: nextValue
      };
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const selectedBuilding = getSelectedBuilding(buildingOptions, form.buildingId);

    onSubmit({
      buildingId: Number(form.buildingId),
      roomCode: buildFullRoomCode(form.roomCode, selectedBuilding?.buildingCode),
      roomName: form.roomName,
      floor: Number(form.floor),
      price: Number(form.price),
      area: Number(form.area),
      maxOccupants: Number(form.maxOccupants),
      status: lockOccupiedStatus ? 'OCCUPIED' : form.status,
      description: form.description
    });
  };

  const hasBuildings = buildingOptions.length > 0;
  const selectedBuilding = getSelectedBuilding(buildingOptions, form.buildingId);
  const selectedBuildingLabel = selectedBuilding
    ? `${selectedBuilding.buildingCode} - ${selectedBuilding.name}`
    : t('forms.room.noBuildings');
  const roomCodePrefix = selectedBuilding?.buildingCode ? `${selectedBuilding.buildingCode}-` : '';
  const roomCodeMaxLength = Math.max(1, 50 - roomCodePrefix.length);
  const statusOptions = lockOccupiedStatus
    ? ROOM_STATUS_OPTIONS.filter((status) => status.value === 'OCCUPIED')
    : ROOM_STATUS_OPTIONS;

  return (
    <form className="panel-form room-form" onSubmit={handleSubmit}>
      <label htmlFor="buildingId">{t('tables.common.building')}</label>
      {lockBuilding ? (
        <div className="readonly-field room-building-readonly" aria-label={t('tables.common.building')}>
          {selectedBuildingLabel}
        </div>
      ) : (
        <select
          id="buildingId"
          name="buildingId"
          value={form.buildingId}
          onChange={handleChange}
          required
          disabled={!hasBuildings}
        >
          <option value="">{hasBuildings ? t('forms.room.selectBuilding') : t('forms.room.noBuildings')}</option>
          {buildingOptions.map((building) => (
            <option key={building.id} value={building.id}>
              {building.buildingCode} - {building.name}
            </option>
          ))}
        </select>
      )}

      <label htmlFor="roomCode">{t('forms.room.roomCode')}</label>
      <div className="room-code-input-group">
        <span className="room-code-prefix">{roomCodePrefix || t('forms.room.selectBuilding')}</span>
        <input
          id="roomCode"
          name="roomCode"
          value={form.roomCode}
          onChange={handleChange}
          maxLength={roomCodeMaxLength}
          required
          disabled={!roomCodePrefix}
          placeholder="P103"
        />
      </div>

      <label htmlFor="roomName">{t('forms.room.roomName')}</label>
      <input
        id="roomName"
        name="roomName"
        value={form.roomName}
        onChange={handleChange}
        maxLength={160}
        required
      />

      <div className="form-grid">
        <div>
          <label htmlFor="floor">{t('tables.common.floor')}</label>
          <input
            id="floor"
            name="floor"
          type="number"
          min="1"
          max={selectedBuilding?.floors || undefined}
          value={form.floor}
          onChange={handleChange}
          required
          />
        </div>
        <div>
          <label htmlFor="maxOccupants">{t('tables.common.maxOccupants')}</label>
          <input
            id="maxOccupants"
            name="maxOccupants"
            type="number"
            min="1"
            value={form.maxOccupants}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="form-grid">
        <div>
          <label htmlFor="price">
            {t('tables.common.price')} <span className="field-unit-note">(đ)</span>
          </label>
          <input
            id="price"
            name="price"
            type="text"
            inputMode="decimal"
            pattern="[0-9]*([.][0-9]*)?"
            value={form.price}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label htmlFor="area">
            {t('tables.common.area')} <span className="field-unit-note">(m2)</span>
          </label>
          <input
            id="area"
            name="area"
            type="number"
            min="0"
            step="0.01"
            value={form.area}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <label htmlFor="status">{t('tables.common.status')}</label>
      <select
        id="status"
        name="status"
        value={lockOccupiedStatus ? 'OCCUPIED' : form.status}
        onChange={handleChange}
        disabled={lockOccupiedStatus}
        required
      >
        {statusOptions.map((status) => (
          <option key={status.value} value={status.value}>
            {formatEnumLabel(t, 'roomStatus', status.value)}
          </option>
        ))}
      </select>

      <label htmlFor="description">{t('tables.common.description')}</label>
      <textarea
        id="description"
        name="description"
        value={form.description || ''}
        onChange={handleChange}
        maxLength={1000}
        rows="2"
      />

      <div className="form-action-row form-action-row-right">
        <button type="submit" disabled={loading || !selectedBuilding}>
          {loading ? t('common.saving') : submitLabel}
        </button>
      </div>
    </form>
  );
}

function getSelectedBuilding(buildingOptions, buildingId) {
  return buildingOptions.find((building) => String(building.id) === String(buildingId));
}
