import { useState } from 'react';
import { VEHICLE_OWNER_TYPE_OPTIONS, VEHICLE_TYPE_OPTIONS } from '../utils/vehicleOptions.js';

const emptyForm = {
  ownerType: 'RESIDENT_HEAD',
  ownerName: '',
  vehicleType: 'MOTORBIKE',
  licensePlate: '',
  brand: '',
  color: '',
  startDate: '',
  endDate: ''
};

export default function VehicleForm({ approvedMembers, loading, onSubmit }) {
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
      licensePlate: form.licensePlate,
      brand: form.brand || null,
      color: form.color || null,
      startDate: form.startDate || null,
      endDate: form.endDate || null
    });
  };

  const requiresMemberOwner = form.ownerType === 'ROOM_MEMBER';
  const hasApprovedMembers = approvedMembers.length > 0;

  return (
    <form className="panel-form" onSubmit={handleSubmit}>
      <label htmlFor="ownerType">Owner type</label>
      <select id="ownerType" name="ownerType" value={form.ownerType} onChange={handleChange} required>
        {VEHICLE_OWNER_TYPE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {requiresMemberOwner && (
        <>
          <label htmlFor="ownerName">Owner name</label>
          <select
            id="ownerName"
            name="ownerName"
            value={form.ownerName}
            onChange={handleChange}
            required
            disabled={!hasApprovedMembers}
          >
            <option value="">{hasApprovedMembers ? 'Select approved member' : 'No approved members available'}</option>
            {approvedMembers.map((member) => (
              <option key={member.id} value={member.fullName}>
                {member.fullName}
              </option>
            ))}
          </select>
        </>
      )}

      <label htmlFor="vehicleType">Vehicle type</label>
      <select id="vehicleType" name="vehicleType" value={form.vehicleType} onChange={handleChange} required>
        {VEHICLE_TYPE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <label htmlFor="licensePlate">License plate</label>
      <input
        id="licensePlate"
        name="licensePlate"
        value={form.licensePlate}
        onChange={handleChange}
        maxLength={30}
        required
      />

      <div className="form-grid">
        <div>
          <label htmlFor="brand">Brand</label>
          <input id="brand" name="brand" value={form.brand} onChange={handleChange} maxLength={80} />
        </div>
        <div>
          <label htmlFor="color">Color</label>
          <input id="color" name="color" value={form.color} onChange={handleChange} maxLength={40} />
        </div>
      </div>

      <div className="form-grid">
        <div>
          <label htmlFor="startDate">Start date</label>
          <input id="startDate" name="startDate" type="date" lang="en-GB" value={form.startDate} onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="endDate">End date</label>
          <input id="endDate" name="endDate" type="date" lang="en-GB" value={form.endDate} onChange={handleChange} />
        </div>
      </div>

      <button type="submit" disabled={loading || (requiresMemberOwner && !hasApprovedMembers)}>
        {loading ? 'Submitting...' : 'Request registration'}
      </button>
    </form>
  );
}
