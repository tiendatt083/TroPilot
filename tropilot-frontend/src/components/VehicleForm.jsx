import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { VEHICLE_OWNER_TYPE_OPTIONS, VEHICLE_TYPE_OPTIONS } from '../utils/vehicleOptions.js';

const emptyForm = {
  ownerType: 'RESIDENT_HEAD',
  ownerName: '',
  vehicleType: 'MOTORBIKE',
  licensePlate: ''
};

export default function VehicleForm({ approvedMembers, loading, onCancel, onSubmit }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(emptyForm);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => {
      const nextForm = {
        ...current,
        [name]: value
      };

      if (name === 'ownerType' && value === 'RESIDENT_HEAD') {
        nextForm.ownerName = '';
      }

      return nextForm;
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      ownerType: form.ownerType,
      ownerName: form.ownerType === 'ROOM_MEMBER' ? form.ownerName : null,
      vehicleType: form.vehicleType,
      licensePlate: form.licensePlate
    });
  };

  const requiresMemberOwner = form.ownerType === 'ROOM_MEMBER';
  const hasApprovedMembers = approvedMembers.length > 0;

  return (
    <form className="panel-form" onSubmit={handleSubmit}>
      <label htmlFor="ownerType">{t('vehicles.form.ownerType')}</label>
      <select id="ownerType" name="ownerType" value={form.ownerType} onChange={handleChange} required>
        {VEHICLE_OWNER_TYPE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {t(`enum.vehicleOwnerType.${option.value}`)}
          </option>
        ))}
      </select>

      {requiresMemberOwner && (
        <>
          <label htmlFor="ownerName">{t('vehicles.form.ownerName')}</label>
          <select
            id="ownerName"
            name="ownerName"
            value={form.ownerName}
            onChange={handleChange}
            required
            disabled={!hasApprovedMembers}
          >
            <option value="">
              {hasApprovedMembers ? t('vehicles.form.selectMember') : t('vehicles.form.noMembers')}
            </option>
            {approvedMembers.map((member) => (
              <option key={member.id} value={member.fullName}>
                {member.fullName}
              </option>
            ))}
          </select>
        </>
      )}

      <label htmlFor="vehicleType">{t('vehicles.form.vehicleType')}</label>
      <select id="vehicleType" name="vehicleType" value={form.vehicleType} onChange={handleChange} required>
        {VEHICLE_TYPE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {t(`enum.vehicleType.${option.value}`)}
          </option>
        ))}
      </select>

      <label htmlFor="licensePlate">{t('vehicles.form.licensePlate')}</label>
      <input
        id="licensePlate"
        name="licensePlate"
        value={form.licensePlate}
        onChange={handleChange}
        maxLength={30}
        required
      />

      <div className="form-action-row">
        <button type="submit" disabled={loading || (requiresMemberOwner && !hasApprovedMembers)}>
          {loading ? t('vehicles.form.submitting') : t('vehicles.form.submit')}
        </button>
        {onCancel && (
          <button className="secondary-button inline-button" type="button" disabled={loading} onClick={onCancel}>
            {t('common.cancel')}
          </button>
        )}
      </div>
    </form>
  );
}
