import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EQUIPMENT_CONDITIONS, EQUIPMENT_SCOPES } from '../utils/equipmentOptions.js';
import { formatRoomLabel } from '../utils/roomDisplay.js';

function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateValue, days) {
  if (!dateValue || !days) {
    return null;
  }

  const [year, month, day] = dateValue.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + Number(days));

  const nextYear = date.getFullYear();
  const nextMonth = String(date.getMonth() + 1).padStart(2, '0');
  const nextDay = String(date.getDate()).padStart(2, '0');
  return `${nextYear}-${nextMonth}-${nextDay}`;
}

function daysBetween(startDate, endDate) {
  if (!startDate || !endDate) {
    return '';
  }

  const start = Date.parse(`${startDate}T00:00:00`);
  const end = Date.parse(`${endDate}T00:00:00`);
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
    return '';
  }

  return String(Math.round((end - start) / 86400000));
}

function emptyValues(fixedBuilding) {
  return {
    buildingId: fixedBuilding?.id ? String(fixedBuilding.id) : '',
    equipmentCode: '',
    name: '',
    scope: 'BUILDING',
    roomId: '',
    locationDescription: '',
    addedDate: todayValue(),
    installationDate: '',
    maintenanceCycleDays: '',
    lastMaintenanceDate: '',
    condition: 'GOOD'
  };
}

function valuesFromEquipment(equipment, fixedBuilding) {
  if (!equipment) {
    return emptyValues(fixedBuilding);
  }

  const baseDate = equipment.installationDate || equipment.addedDate || todayValue();

  return {
    buildingId: String(fixedBuilding?.id || equipment.buildingId || ''),
    equipmentCode: equipment.equipmentCode || '',
    name: equipment.name || '',
    scope: equipment.scope || 'BUILDING',
    roomId: equipment.roomId ? String(equipment.roomId) : '',
    locationDescription: equipment.locationDescription || '',
    addedDate: equipment.addedDate || todayValue(),
    installationDate: equipment.installationDate || '',
    maintenanceCycleDays: daysBetween(baseDate, equipment.nextMaintenanceDate),
    lastMaintenanceDate: equipment.lastMaintenanceDate || '',
    condition: equipment.condition || 'GOOD'
  };
}

function optionalDate(value) {
  return value || null;
}

export default function EquipmentForm({
  equipment,
  rooms,
  buildings = [],
  fixedBuilding = null,
  saving,
  onSubmit,
  onCancel
}) {
  const { t } = useTranslation();
  const [values, setValues] = useState(() => valuesFromEquipment(equipment, fixedBuilding));

  useEffect(() => {
    setValues(valuesFromEquipment(equipment, fixedBuilding));
  }, [equipment, fixedBuilding?.id]);

  const availableRooms = useMemo(() => {
    if (!values.buildingId) {
      return [];
    }

    return rooms.filter((room) => !room.buildingId || String(room.buildingId) === values.buildingId);
  }, [rooms, values.buildingId]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setValues((current) => ({
      ...current,
      [name]: value,
      ...(name === 'scope' && value === 'BUILDING' ? { roomId: '' } : {}),
      ...(name === 'buildingId' ? { roomId: '' } : {})
    }));
  };

  const handleScopeChange = (scope) => {
    setValues((current) => ({
      ...current,
      scope,
      ...(scope === 'BUILDING' ? { roomId: '' } : {})
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const baseMaintenanceDate = values.installationDate || values.addedDate || todayValue();
    const nextMaintenanceDate = addDays(baseMaintenanceDate, values.maintenanceCycleDays);

    onSubmit({
      buildingId: values.buildingId ? Number(values.buildingId) : null,
      equipmentCode: values.equipmentCode,
      name: values.name.trim(),
      scope: values.scope,
      roomId: values.scope === 'ROOM' ? Number(values.roomId) : null,
      quantity: 1,
      brand: null,
      model: null,
      locationDescription: values.scope === 'BUILDING' ? values.locationDescription.trim() : null,
      addedDate: optionalDate(values.addedDate),
      installationDate: optionalDate(values.installationDate),
      lastMaintenanceDate: optionalDate(values.lastMaintenanceDate),
      nextMaintenanceDate,
      condition: values.condition,
      note: null
    });
  };

  return (
    <form className="panel-form equipment-form compact-equipment-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        {!fixedBuilding && (
          <div className="form-grid-wide">
            <label htmlFor="equipmentBuilding">{t('equipment.fields.building')}</label>
            <select
              id="equipmentBuilding"
              name="buildingId"
              value={values.buildingId}
              onChange={handleChange}
              required
            >
              <option value="">{t('equipment.placeholders.selectBuilding')}</option>
              {buildings.map((building) => (
                <option key={building.id} value={building.id}>
                  {building.buildingCode} - {building.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="form-grid-wide">
          <label htmlFor="equipmentName">
            {t('equipment.fields.name')} <span aria-hidden="true">*</span>
          </label>
          <input
            id="equipmentName"
            name="name"
            value={values.name}
            maxLength="160"
            placeholder={t('equipment.placeholders.name')}
            onChange={handleChange}
            required
          />
          {!equipment && <small>{t('equipment.help.autoCode')}</small>}
        </div>

        <div className="form-grid-wide">
          <span className="field-label">
            {t('equipment.fields.ownership')} <span aria-hidden="true">*</span>
          </span>
          <div className="segmented-control" role="group" aria-label={t('equipment.fields.ownership')}>
            {EQUIPMENT_SCOPES.map((scope) => (
              <button
                key={scope}
                className={values.scope === scope ? 'active' : ''}
                type="button"
                onClick={() => handleScopeChange(scope)}
              >
                {t(`equipment.scopes.${scope}`)}
              </button>
            ))}
          </div>
          <small>
            {values.scope === 'BUILDING'
              ? t('equipment.help.buildingScope')
              : t('equipment.help.roomScope')}
          </small>
        </div>

        {values.scope === 'BUILDING' ? (
          <div>
            <label htmlFor="equipmentLocation">{t('equipment.fields.location')}</label>
            <input
              id="equipmentLocation"
              name="locationDescription"
              value={values.locationDescription}
              maxLength="255"
              placeholder={t('equipment.placeholders.location')}
              onChange={handleChange}
            />
          </div>
        ) : (
          <div className="form-grid-wide">
            <label htmlFor="equipmentRoom">
              {t('equipment.fields.room')} <span aria-hidden="true">*</span>
            </label>
            <select
              id="equipmentRoom"
              name="roomId"
              value={values.roomId}
              disabled={!values.buildingId}
              onChange={handleChange}
              required
            >
              <option value="">{t('equipment.placeholders.selectRoom')}</option>
              {availableRooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {formatRoomLabel(room)}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label htmlFor="equipmentCondition">
            {t('equipment.fields.condition')} <span aria-hidden="true">*</span>
          </label>
          <select
            id="equipmentCondition"
            name="condition"
            value={values.condition}
            onChange={handleChange}
          >
            {EQUIPMENT_CONDITIONS.map((condition) => (
              <option key={condition} value={condition}>
                {t(`equipment.conditions.${condition}`)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="equipmentInstallationDate">{t('equipment.fields.installationDate')}</label>
          <input
            id="equipmentInstallationDate"
            name="installationDate"
            type="date"
            value={values.installationDate}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="equipmentMaintenanceCycle">{t('equipment.fields.maintenanceCycleDays')}</label>
          <input
            id="equipmentMaintenanceCycle"
            name="maintenanceCycleDays"
            type="number"
            min="1"
            value={values.maintenanceCycleDays}
            placeholder={t('equipment.placeholders.maintenanceCycleDays')}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="button-row form-button-row">
        {equipment && (
          <button className="secondary-button inline-button" type="button" disabled={saving} onClick={onCancel}>
            {t('common.cancel')}
          </button>
        )}
        <button type="submit" disabled={saving}>
          {saving
            ? t('common.saving')
            : equipment
              ? t('equipment.actions.saveChanges')
              : t('equipment.actions.create')}
        </button>
      </div>
    </form>
  );
}
