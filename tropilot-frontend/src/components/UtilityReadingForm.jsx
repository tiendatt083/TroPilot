import { useEffect, useState } from 'react';

const emptyForm = {
  roomId: '',
  month: '',
  oldElectricity: 0,
  newElectricity: 0,
  oldWater: 0,
  newWater: 0,
  editReason: ''
};

export default function UtilityReadingForm({
  rooms,
  initialValues,
  loading,
  mode = 'create',
  submitLabel,
  onSubmit,
  onCancel
}) {
  const [form, setForm] = useState(emptyForm);
  const [electricityImage, setElectricityImage] = useState(null);
  const [waterImage, setWaterImage] = useState(null);

  useEffect(() => {
    setForm({
      ...emptyForm,
      ...initialValues,
      roomId: initialValues?.roomId || '',
      oldElectricity: initialValues?.oldElectricity ?? 0,
      newElectricity: initialValues?.newElectricity ?? 0,
      oldWater: initialValues?.oldWater ?? 0,
      newWater: initialValues?.newWater ?? 0,
      editReason: ''
    });
    setElectricityImage(null);
    setWaterImage(null);
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
      roomId: form.roomId,
      month: form.month,
      oldElectricity: form.oldElectricity,
      newElectricity: form.newElectricity,
      oldWater: form.oldWater,
      newWater: form.newWater,
      editReason: mode === 'edit' ? form.editReason : null,
      electricityImage,
      waterImage
    });
  };

  const editing = mode === 'edit';

  return (
    <form className="panel-form" onSubmit={handleSubmit}>
      <label htmlFor="roomId">Room</label>
      <select id="roomId" name="roomId" value={form.roomId} onChange={handleChange} required>
        <option value="">Select room</option>
        {rooms.map((room) => (
          <option key={room.id} value={room.id}>
            {room.roomCode} - {room.roomName}
          </option>
        ))}
      </select>

      <label htmlFor="month">Reading month</label>
      <input id="month" name="month" type="month" value={form.month} onChange={handleChange} required />

      <div className="form-grid">
        <div>
          <label htmlFor="oldElectricity">Old electricity</label>
          <input
            id="oldElectricity"
            name="oldElectricity"
            type="number"
            min="0"
            step="0.01"
            value={form.oldElectricity}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label htmlFor="newElectricity">New electricity</label>
          <input
            id="newElectricity"
            name="newElectricity"
            type="number"
            min="0"
            step="0.01"
            value={form.newElectricity}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <label htmlFor="electricityImage">Electricity evidence image</label>
      <input
        id="electricityImage"
        name="electricityImage"
        type="file"
        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
        onChange={(event) => setElectricityImage(event.target.files?.[0] || null)}
        required={!editing}
      />

      <div className="form-grid">
        <div>
          <label htmlFor="oldWater">Old water</label>
          <input
            id="oldWater"
            name="oldWater"
            type="number"
            min="0"
            step="0.01"
            value={form.oldWater}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label htmlFor="newWater">New water</label>
          <input
            id="newWater"
            name="newWater"
            type="number"
            min="0"
            step="0.01"
            value={form.newWater}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <label htmlFor="waterImage">Water evidence image</label>
      <input
        id="waterImage"
        name="waterImage"
        type="file"
        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
        onChange={(event) => setWaterImage(event.target.files?.[0] || null)}
        required={!editing}
      />

      <p className="muted-text">Allowed image types: jpg, jpeg, png. Maximum size: 10 MB.</p>

      {editing && (
        <>
          <label htmlFor="editReason">Edit reason</label>
          <textarea
            id="editReason"
            name="editReason"
            value={form.editReason}
            onChange={handleChange}
            maxLength={1000}
            rows="4"
            required
          />
        </>
      )}

      <div className="button-row form-button-row">
        <button type="submit" disabled={loading}>
          {loading ? 'Saving...' : submitLabel}
        </button>
        {onCancel && (
          <button className="secondary-button inline-button" type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
