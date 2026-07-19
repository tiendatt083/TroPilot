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

export default function RoomForm({ buildingOptions, initialValues, loading, submitLabel, onSubmit }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    setForm({
      ...emptyForm,
      ...initialValues,
      buildingId: initialValues?.buildingId ? String(initialValues.buildingId) : '',
      roomCode: stripRoomCodePrefix(initialValues?.roomCode, initialValues?.buildingCode),
      floor: initialValues?.floor ? String(initialValues.floor) : '1',
      price: initialValues?.price !== undefined ? String(initialValues.price) : '0',
      area: initialValues?.area !== undefined ? String(initialValues.area) : '0',
      maxOccupants: initialValues?.maxOccupants ? String(initialValues.maxOccupants) : '1',
      status: initialValues?.status || 'EMPTY'
    });
  }, [initialValues]);

  const handleChange = (event) => {
    const { name, value } = event.target;
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
      status: form.status,
      description: form.description
    });
  };

  const hasBuildings = buildingOptions.length > 0;
  const selectedBuilding = getSelectedBuilding(buildingOptions, form.buildingId);
  const roomCodePrefix = selectedBuilding?.buildingCode ? `${selectedBuilding.buildingCode}-` : '';
  const roomCodeMaxLength = Math.max(1, 50 - roomCodePrefix.length);

  return (
    <form className="panel-form room-form" onSubmit={handleSubmit}>
      <label htmlFor="buildingId">{t('tables.common.building')}</label>
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
            type="number"
            min="0"
            step="0.01"
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
      <select id="status" name="status" value={form.status} onChange={handleChange} required>
        {ROOM_STATUS_OPTIONS.map((status) => (
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

      <button type="submit" disabled={loading || !hasBuildings}>
        {loading ? t('common.saving') : submitLabel}
      </button>
    </form>
  );
}

function getSelectedBuilding(buildingOptions, buildingId) {
  return buildingOptions.find((building) => String(building.id) === String(buildingId));
}
