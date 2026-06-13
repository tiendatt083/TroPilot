import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  formatDateInputValue,
  formatDisplayDate,
  formatDisplayMonth,
  getMonthDateRange,
  getMonthFromDateInput
} from '../utils/dateFormat.js';
import { resolveFileUrl } from '../utils/fileUrl.js';
import { formatRoomLabel } from '../utils/roomDisplay.js';

const emptyForm = {
  roomId: '',
  month: '',
  readingDate: formatDateInputValue(),
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
  selectedMonth,
  loading,
  mode = 'create',
  submitLabel,
  onSubmit,
  onCancel
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState(emptyForm);
  const [electricityImage, setElectricityImage] = useState(null);
  const [waterImage, setWaterImage] = useState(null);

  useEffect(() => {
    const readingDate = normalizeReadingDate(initialValues, selectedMonth);

    setForm({
      ...emptyForm,
      ...initialValues,
      roomId: initialValues?.roomId || '',
      month: initialValues?.month || getMonthFromDateInput(readingDate),
      readingDate,
      oldElectricity: initialValues?.oldElectricity ?? 0,
      newElectricity: initialValues?.newElectricity ?? 0,
      oldWater: initialValues?.oldWater ?? 0,
      newWater: initialValues?.newWater ?? 0,
      editReason: ''
    });
    setElectricityImage(null);
    setWaterImage(null);
  }, [initialValues, selectedMonth]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'readingDate' ? { month: getMonthFromDateInput(value) } : {})
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
      month: getMonthFromDateInput(form.readingDate),
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
  const noEligibleRooms = !editing && rooms.length === 0;
  const readingDateRange = getMonthDateRange(selectedMonth);

  return (
    <form className="panel-form" onSubmit={handleSubmit}>
      <label htmlFor="roomId">{t('tables.common.room')}</label>
      <select
        id="roomId"
        name="roomId"
        value={form.roomId}
        onChange={handleChange}
        required
        disabled={editing || noEligibleRooms}
      >
        <option value="">
          {noEligibleRooms
            ? t('buildingUtilityReadings.noEligibleRooms')
            : t('forms.utilityReading.selectRoom')}
        </option>
        {rooms.map((room) => (
          <option key={room.id} value={room.id}>
            {formatRoomLabel(room)}
          </option>
        ))}
      </select>

      {form.roomId && <PreviousReadingEvidence previousReading={previousReading} t={t} />}

      <div className="form-grid">
        <div>
          <label htmlFor="oldElectricity">{t('forms.utilityReading.oldElectricity')}</label>
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
          <label htmlFor="newElectricity">{t('forms.utilityReading.newElectricity')}</label>
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

      <label htmlFor="electricityImage">{t('forms.utilityReading.electricityEvidenceImage')}</label>
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
          <label htmlFor="oldWater">{t('forms.utilityReading.oldWater')}</label>
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
          <label htmlFor="newWater">{t('forms.utilityReading.newWater')}</label>
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

      <label htmlFor="waterImage">{t('forms.utilityReading.waterEvidenceImage')}</label>
      <input
        id="waterImage"
        name="waterImage"
        type="file"
        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
        onChange={(event) => setWaterImage(event.target.files?.[0] || null)}
        required={!editing}
      />

      <p className="muted-text">{t('forms.utilityReading.allowedImageTypes')}</p>

      {editing && (
        <>
          <label htmlFor="editReason">{t('tables.common.editReason')}</label>
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
        <label htmlFor="readingDate">{t('tables.common.readingDate')}</label>
        <input
          id="readingDate"
          name="readingDate"
          type="date"
          lang="en-GB"
          value={form.readingDate}
          onChange={handleChange}
          min={readingDateRange.min}
          max={readingDateRange.max}
          required
        />
        <span className="field-help">{t('forms.utilityReading.readingDateHelp')}</span>
      </div>

      <div className="button-row form-button-row">
        <button type="submit" disabled={loading || noEligibleRooms}>
          {loading ? t('common.saving') : submitLabel}
        </button>
        {onCancel && (
          <button className="secondary-button inline-button" type="button" onClick={onCancel}>
            {t('common.cancel')}
          </button>
        )}
      </div>
    </form>
  );
}

function PreviousReadingEvidence({ previousReading, t }) {
  if (!previousReading) {
    return (
      <div className="previous-reading-panel">
        <strong>{t('forms.utilityReading.previousMonthEvidence')}</strong>
        <span className="table-subtext">{t('forms.utilityReading.noPreviousEvidence')}</span>
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
        <strong>{t('forms.utilityReading.previousMonthEvidence')}</strong>
        <span className="table-subtext">
          {formatDisplayMonth(previousReading.month)}
          {previousReading.readingDate ? ` - ${formatDisplayDate(previousReading.readingDate)}` : ''}
        </span>
      </div>
      <div className="previous-reading-images">
        {electricityImageUrl && (
          <a className="previous-reading-image-link" href={electricityImageUrl} target="_blank" rel="noreferrer">
            <span>{t('forms.utilityReading.previousElectricityImage')}</span>
            <img src={electricityImageUrl} alt={t('forms.utilityReading.previousElectricityAlt')} />
          </a>
        )}
        {waterImageUrl && (
          <a className="previous-reading-image-link" href={waterImageUrl} target="_blank" rel="noreferrer">
            <span>{t('forms.utilityReading.previousWaterImage')}</span>
            <img src={waterImageUrl} alt={t('forms.utilityReading.previousWaterAlt')} />
          </a>
        )}
      </div>
    </div>
  );
}

function findPreviousReading(readings, roomId, readingDate, currentReadingId) {
  const selectedMonth = getMonthFromDateInput(readingDate);

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

function normalizeReadingDate(values, selectedMonth) {
  if (values?.readingDate) {
    return values.readingDate;
  }

  if (values?.month) {
    return `${values.month}-01`;
  }

  if (selectedMonth) {
    const today = formatDateInputValue();
    return today.startsWith(selectedMonth) ? today : `${selectedMonth}-01`;
  }

  return formatDateInputValue();
}
