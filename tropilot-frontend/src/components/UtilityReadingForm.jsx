import { useEffect, useMemo, useState } from 'react';
import { resolveFileUrl } from '../utils/fileUrl.js';
import { formatRoomLabel } from '../utils/roomDisplay.js';

const emptyForm = {
  roomId: '',
  month: '',
  readingDate: getTodayInputValue(),
  oldElectricity: 0,
  newElectricity: 0,
  oldWater: 0,
  newWater: 0,
  editReason: ''
};

export default function UtilityReadingForm({
  rooms,
  readings = [],
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
    const readingDate = normalizeReadingDate(initialValues);

    setForm({
      ...emptyForm,
      ...initialValues,
      roomId: initialValues?.roomId || '',
      month: initialValues?.month || getMonthFromReadingDate(readingDate),
      readingDate,
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
      [name]: value,
      ...(name === 'readingDate' ? { month: getMonthFromReadingDate(value) } : {})
    }));
  };

  const previousReading = useMemo(
    () => findPreviousReading(readings, form.roomId, form.readingDate, initialValues?.id),
    [readings, form.roomId, form.readingDate, initialValues?.id]
  );

  const handleSubmit = (event) => {
    event.preventDefault();

    onSubmit({
      roomId: form.roomId,
      month: getMonthFromReadingDate(form.readingDate),
      readingDate: form.readingDate,
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
            {formatRoomLabel(room)}
          </option>
        ))}
      </select>

      {form.roomId && <PreviousReadingEvidence previousReading={previousReading} />}

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

      <div>
        <label htmlFor="readingDate">Reading date</label>
        <input
          id="readingDate"
          name="readingDate"
          type="date"
          value={form.readingDate}
          onChange={handleChange}
          required
        />
        <span className="field-help">This date applies to both electricity and water readings.</span>
      </div>

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

function PreviousReadingEvidence({ previousReading }) {
  if (!previousReading) {
    return (
      <div className="previous-reading-panel">
        <strong>Previous month evidence</strong>
        <span className="table-subtext">No previous reading evidence found for this room.</span>
      </div>
    );
  }

  const electricityImageUrl = previousReading.electricityImageUrl
    ? resolveFileUrl(previousReading.electricityImageUrl)
    : null;
  const waterImageUrl = previousReading.waterImageUrl
    ? resolveFileUrl(previousReading.waterImageUrl)
    : null;

  return (
    <div className="previous-reading-panel">
      <div>
        <strong>Previous month evidence</strong>
        <span className="table-subtext">
          {previousReading.month}
          {previousReading.readingDate ? ` - ${previousReading.readingDate}` : ''}
        </span>
      </div>
      <div className="previous-reading-images">
        {electricityImageUrl && (
          <a className="previous-reading-image-link" href={electricityImageUrl} target="_blank" rel="noreferrer">
            <span>Previous electricity image</span>
            <img src={electricityImageUrl} alt="Previous electricity meter evidence" />
          </a>
        )}
        {waterImageUrl && (
          <a className="previous-reading-image-link" href={waterImageUrl} target="_blank" rel="noreferrer">
            <span>Previous water image</span>
            <img src={waterImageUrl} alt="Previous water meter evidence" />
          </a>
        )}
      </div>
    </div>
  );
}

function findPreviousReading(readings, roomId, readingDate, currentReadingId) {
  const selectedMonth = getMonthFromReadingDate(readingDate);

  if (!roomId || !selectedMonth) {
    return null;
  }

  const previousReadings = [...readings]
    .filter((reading) => String(reading.roomId) === String(roomId))
    .filter((reading) => reading.id !== currentReadingId)
    .filter((reading) => reading.month && reading.month < selectedMonth)
    .sort((first, second) => getReadingSortValue(second).localeCompare(getReadingSortValue(first)));

  return previousReadings[0] || null;
}

function getReadingSortValue(reading) {
  return reading.readingDate || (reading.month ? `${reading.month}-01` : '');
}

function normalizeReadingDate(values) {
  if (values?.readingDate) {
    return values.readingDate;
  }

  if (values?.month) {
    return `${values.month}-01`;
  }

  return getTodayInputValue();
}

function getMonthFromReadingDate(readingDate) {
  return readingDate ? readingDate.slice(0, 7) : '';
}

function getTodayInputValue() {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}
