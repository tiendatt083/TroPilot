import { useEffect, useState } from 'react';
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
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    setForm({
      ...emptyForm,
      ...initialValues,
      buildingId: initialValues?.buildingId ? String(initialValues.buildingId) : '',
      floor: initialValues?.floor ? String(initialValues.floor) : '1',
      price: initialValues?.price !== undefined ? String(initialValues.price) : '0',
      area: initialValues?.area !== undefined ? String(initialValues.area) : '0',
      maxOccupants: initialValues?.maxOccupants ? String(initialValues.maxOccupants) : '1',
      status: initialValues?.status || 'EMPTY'
    });
  }, [initialValues]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      buildingId: Number(form.buildingId),
      roomCode: form.roomCode,
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

  return (
    <form className="panel-form" onSubmit={handleSubmit}>
      <label htmlFor="buildingId">Building</label>
      <select
        id="buildingId"
        name="buildingId"
        value={form.buildingId}
        onChange={handleChange}
        required
        disabled={!hasBuildings}
      >
        <option value="">{hasBuildings ? 'Select building' : 'No buildings available'}</option>
        {buildingOptions.map((building) => (
          <option key={building.id} value={building.id}>
            {building.buildingCode} - {building.name}
          </option>
        ))}
      </select>

      <label htmlFor="roomCode">Room code</label>
      <input
        id="roomCode"
        name="roomCode"
        value={form.roomCode}
        onChange={handleChange}
        maxLength={50}
        required
      />

      <label htmlFor="roomName">Room name</label>
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
          <label htmlFor="floor">Floor</label>
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
          <label htmlFor="maxOccupants">Maximum occupants</label>
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
          <label htmlFor="price">Price</label>
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
          <label htmlFor="area">Area</label>
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

      <label htmlFor="status">Status</label>
      <select id="status" name="status" value={form.status} onChange={handleChange} required>
        {ROOM_STATUS_OPTIONS.map((status) => (
          <option key={status.value} value={status.value}>
            {status.label}
          </option>
        ))}
      </select>

      <label htmlFor="description">Description</label>
      <textarea
        id="description"
        name="description"
        value={form.description || ''}
        onChange={handleChange}
        maxLength={1000}
        rows="4"
      />

      <button type="submit" disabled={loading || !hasBuildings}>
        {loading ? 'Saving...' : submitLabel}
      </button>
    </form>
  );
}
