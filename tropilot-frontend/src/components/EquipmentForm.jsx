import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EQUIPMENT_CONDITIONS, EQUIPMENT_SCOPES } from '../utils/equipmentOptions.js';
import { formatRoomLabel } from '../utils/roomDisplay.js';

function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

function initialValues() {
  return {
    equipmentCode: '',
    name: '',
    scope: 'BUILDING',
    roomId: '',
    quantity: 1,
    brand: '',
    model: '',
    locationDescription: '',
    addedDate: todayValue(),
    installationDate: '',
    lastMaintenanceDate: '',
    nextMaintenanceDate: '',
    condition: 'GOOD',
    note: ''
  };
}

function valuesFromEquipment(equipment) {
  if (!equipment) {
    return initialValues();
  }

  return {
    equipmentCode: equipment.equipmentCode || '',
    name: equipment.name || '',
    scope: equipment.scope || 'BUILDING',
    roomId: equipment.roomId ? String(equipment.roomId) : '',
    quantity: equipment.quantity || 1,
    brand: equipment.brand || '',
    model: equipment.model || '',
    locationDescription: equipment.locationDescription || '',
    addedDate: equipment.addedDate || todayValue(),
    installationDate: equipment.installationDate || '',
    lastMaintenanceDate: equipment.lastMaintenanceDate || '',
    nextMaintenanceDate: equipment.nextMaintenanceDate || '',
    condition: equipment.condition || 'GOOD',
    note: equipment.note || ''
  };
}

export default function EquipmentForm({ equipment, rooms, saving, onSubmit, onCancel }) {
  const { t } = useTranslation();
  const [values, setValues] = useState(() => valuesFromEquipment(equipment));

  useEffect(() => {
    setValues(valuesFromEquipment(equipment));
  }, [equipment]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setValues((current) => ({
      ...current,
      [name]: value,
      ...(name === 'scope' && value === 'BUILDING' ? { roomId: '' } : {})
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    onSubmit({
      ...values,
      roomId: values.scope === 'ROOM' ? Number(values.roomId) : null,
      quantity: Number(values.quantity)
    });
  };

  return (
    <form className="panel-form equipment-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <div>
          <label htmlFor="equipmentCode">{t('equipment.fields.code')}</label>
          <input
            id="equipmentCode"
            name="equipmentCode"
            value={values.equipmentCode}
            maxLength="60"
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label htmlFor="equipmentName">{t('equipment.fields.name')}</label>
          <input
            id="equipmentName"
            name="name"
            value={values.name}
            maxLength="160"
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label htmlFor="equipmentScope">{t('equipment.fields.scope')}</label>
          <select id="equipmentScope" name="scope" value={values.scope} onChange={handleChange}>
            {EQUIPMENT_SCOPES.map((scope) => (
              <option key={scope} value={scope}>
                {t(`equipment.scopes.${scope}`)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="equipmentRoom">{t('equipment.fields.room')}</label>
          <select
            id="equipmentRoom"
            name="roomId"
            value={values.roomId}
            disabled={values.scope !== 'ROOM'}
            onChange={handleChange}
            required={values.scope === 'ROOM'}
          >
            <option value="">{t('equipment.placeholders.selectRoom')}</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {formatRoomLabel(room)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="equipmentQuantity">{t('equipment.fields.quantity')}</label>
          <input
            id="equipmentQuantity"
            name="quantity"
            type="number"
            min="1"
            value={values.quantity}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label htmlFor="equipmentCondition">{t('equipment.fields.condition')}</label>
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
          <label htmlFor="equipmentBrand">{t('equipment.fields.brand')}</label>
          <input
            id="equipmentBrand"
            name="brand"
            value={values.brand}
            maxLength="120"
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="equipmentModel">{t('equipment.fields.model')}</label>
          <input
            id="equipmentModel"
            name="model"
            value={values.model}
            maxLength="120"
            onChange={handleChange}
          />
        </div>

        <div className="form-grid-wide">
          <label htmlFor="equipmentLocation">{t('equipment.fields.location')}</label>
          <input
            id="equipmentLocation"
            name="locationDescription"
            value={values.locationDescription}
            maxLength="255"
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="equipmentAddedDate">{t('equipment.fields.addedDate')}</label>
          <input
            id="equipmentAddedDate"
            name="addedDate"
            type="date"
            value={values.addedDate}
            onChange={handleChange}
          />
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
          <label htmlFor="equipmentLastMaintenanceDate">{t('equipment.fields.lastMaintenanceDate')}</label>
          <input
            id="equipmentLastMaintenanceDate"
            name="lastMaintenanceDate"
            type="date"
            value={values.lastMaintenanceDate}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="equipmentNextMaintenanceDate">{t('equipment.fields.nextMaintenanceDate')}</label>
          <input
            id="equipmentNextMaintenanceDate"
            name="nextMaintenanceDate"
            type="date"
            value={values.nextMaintenanceDate}
            min={values.lastMaintenanceDate || undefined}
            onChange={handleChange}
          />
        </div>

        <div className="form-grid-wide">
          <label htmlFor="equipmentNote">{t('equipment.fields.note')}</label>
          <textarea
            id="equipmentNote"
            name="note"
            rows="4"
            value={values.note}
            maxLength="1200"
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="button-row form-button-row">
        <button type="submit" disabled={saving}>
          {saving
            ? t('common.saving')
            : equipment
              ? t('equipment.actions.saveChanges')
              : t('equipment.actions.add')}
        </button>
        {equipment && (
          <button className="secondary-button inline-button" type="button" disabled={saving} onClick={onCancel}>
            {t('common.cancel')}
          </button>
        )}
      </div>
    </form>
  );
}
