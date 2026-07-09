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
import { formatNumber } from '../utils/numberFormat.js';
import { formatRoomCode } from '../utils/roomDisplay.js';
import LineIcon from './common/LineIcon.jsx';

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
  onFetchReadings,
  onFetchElectricityReading,
  onFetchWaterReading,
  onSubmit,
  onCancel
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState(emptyForm);
  const [electricityImage, setElectricityImage] = useState(null);
  const [waterImage, setWaterImage] = useState(null);
  const [fetchingMeter, setFetchingMeter] = useState('');
  const [fetchError, setFetchError] = useState('');

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
    setFetchError('');
  }, [initialValues, selectedMonth]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === 'roomId' || name === 'readingDate') {
      setFetchError('');
    }

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

  const editing = mode === 'edit';

  const handleFetchMeter = async (meterType) => {
    const fetcher = meterType === 'electricity'
      ? (onFetchElectricityReading || onFetchReadings)
      : (onFetchWaterReading || onFetchReadings);

    if (!fetcher || !form.roomId || !form.readingDate) {
      return;
    }

    setFetchingMeter(meterType);
    setFetchError('');

    try {
      const response = await fetcher({
        roomId: form.roomId,
        readingDate: form.readingDate
      });
      const reading = response.data;
      const normalizedReading = normalizeFetchedMeter(reading, meterType);

      setForm((current) => ({
        ...current,
        ...(meterType === 'electricity'
          ? {
              oldElectricity: normalizedReading.oldReading,
              newElectricity: normalizedReading.newReading
            }
          : {
              oldWater: normalizedReading.oldReading,
              newWater: normalizedReading.newReading
            })
      }));
    } catch (apiError) {
      setFetchError(
        apiError.response?.data?.message
          || t(meterType === 'electricity'
            ? 'forms.utilityReading.electricityFetchError'
            : 'forms.utilityReading.waterFetchError')
      );
    } finally {
      setFetchingMeter('');
    }
  };

  useEffect(() => {
    if (editing) {
      return;
    }

    const oldElectricity = previousReading?.newElectricity ?? 0;
    const oldWater = previousReading?.newWater ?? 0;

    setForm((current) => {
      const normalizedNewElectricity = Number(current.newElectricity) < Number(oldElectricity)
        ? oldElectricity
        : current.newElectricity;
      const normalizedNewWater = Number(current.newWater) < Number(oldWater)
        ? oldWater
        : current.newWater;

      if (
        String(current.oldElectricity) === String(oldElectricity)
        && String(current.oldWater) === String(oldWater)
        && String(current.newElectricity) === String(normalizedNewElectricity)
        && String(current.newWater) === String(normalizedNewWater)
      ) {
        return current;
      }

      return {
        ...current,
        oldElectricity,
        oldWater,
        newElectricity: normalizedNewElectricity,
        newWater: normalizedNewWater
      };
    });
  }, [
    editing,
    previousReading?.id,
    previousReading?.newElectricity,
    previousReading?.newWater
  ]);

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

  const noEligibleRooms = !editing && rooms.length === 0;
  const readingDateRange = getMonthDateRange(selectedMonth);

  return (
    <form className="panel-form utility-reading-entry-form" onSubmit={handleSubmit}>
      <div className="utility-reading-shared-form">
        <div>
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
                {formatRoomCode(room)}
              </option>
            ))}
          </select>
        </div>

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
        </div>
      </div>

      {fetchError && <p className="utility-reading-fetch-error utility-reading-inline-error" role="alert">{fetchError}</p>}

      {form.roomId && <PreviousReadingEvidence previousReading={previousReading} t={t} />}

      <div className="utility-reading-form-sections">
        <ElectricityReadingSubform
          form={form}
          t={t}
          editing={editing}
          loading={loading}
          fetching={fetchingMeter === 'electricity'}
          canFetch={!editing && Boolean(onFetchReadings || onFetchElectricityReading)}
          onChange={handleChange}
          onFetch={() => handleFetchMeter('electricity')}
          onImageChange={setElectricityImage}
        />
        <WaterReadingSubform
          form={form}
          t={t}
          editing={editing}
          loading={loading}
          fetching={fetchingMeter === 'water'}
          canFetch={!editing && Boolean(onFetchReadings || onFetchWaterReading)}
          onChange={handleChange}
          onFetch={() => handleFetchMeter('water')}
          onImageChange={setWaterImage}
        />
      </div>

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

function ElectricityReadingSubform({
  form,
  t,
  editing,
  loading,
  fetching,
  canFetch,
  onChange,
  onFetch,
  onImageChange
}) {
  const unit = t('forms.utilityReading.electricityUnit');

  return (
    <fieldset className="utility-reading-meter-form meter-form-electricity">
      <legend>
        <span>
          {t('forms.utilityReading.electricitySectionTitle')}
          <span className="meter-title-unit">({unit})</span>
        </span>
        {canFetch && (
          <span className="meter-mock-control">
            <em>{t('forms.utilityReading.mockApi')}</em>
            <button
              className="secondary-button utility-reading-fetch-button"
              type="button"
              onClick={onFetch}
              disabled={loading || fetching || !form.roomId || !form.readingDate}
            >
              <LineIcon name="refresh" />
              {fetching ? t('forms.utilityReading.fetchingReadings') : t('forms.utilityReading.fetchMeterShort')}
            </button>
          </span>
        )}
      </legend>

      <div className="utility-reading-meter-form-body">
        <div className="utility-meter-reading-row">
          <MeterDisplay
            label={t('forms.utilityReading.oldElectricity')}
            value={form.oldElectricity}
          />
          <div className="utility-meter-field">
            <div className="meter-field-label">
              <label htmlFor="newElectricity">{t('forms.utilityReading.newElectricity')}</label>
            </div>
            <input
              className="utility-reading-meter-value-input"
              id="newElectricity"
              name="newElectricity"
              type="number"
              min="0"
              step="0.01"
              value={form.newElectricity}
              onChange={onChange}
              required
            />
          </div>
        </div>

        <div className="utility-reading-evidence-field">
          <label htmlFor="electricityImage">{t('forms.utilityReading.electricityEvidenceImage')}</label>
          <input
            id="electricityImage"
            name="electricityImage"
            type="file"
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              onChange={(event) => onImageChange(event.target.files?.[0] || null)}
            />
        </div>
      </div>
    </fieldset>
  );
}

function WaterReadingSubform({
  form,
  t,
  editing,
  loading,
  fetching,
  canFetch,
  onChange,
  onFetch,
  onImageChange
}) {
  const unit = t('forms.utilityReading.waterUnit');

  return (
    <fieldset className="utility-reading-meter-form meter-form-water">
      <legend>
        <span>
          {t('forms.utilityReading.waterSectionTitle')}
          <span className="meter-title-unit">({unit})</span>
        </span>
        {canFetch && (
          <span className="meter-mock-control">
            <em>{t('forms.utilityReading.mockApi')}</em>
            <button
              className="secondary-button utility-reading-fetch-button"
              type="button"
              onClick={onFetch}
              disabled={loading || fetching || !form.roomId || !form.readingDate}
            >
              <LineIcon name="refresh" />
              {fetching ? t('forms.utilityReading.fetchingReadings') : t('forms.utilityReading.fetchMeterShort')}
            </button>
          </span>
        )}
      </legend>

      <div className="utility-reading-meter-form-body">
        <div className="utility-meter-reading-row">
          <MeterDisplay
            label={t('forms.utilityReading.oldWater')}
            value={form.oldWater}
          />
          <div className="utility-meter-field">
            <div className="meter-field-label">
              <label htmlFor="newWater">{t('forms.utilityReading.newWater')}</label>
            </div>
            <input
              className="utility-reading-meter-value-input"
              id="newWater"
              name="newWater"
              type="number"
              min="0"
              step="0.01"
              value={form.newWater}
              onChange={onChange}
              required
            />
          </div>
        </div>

        <div className="utility-reading-evidence-field">
          <label htmlFor="waterImage">{t('forms.utilityReading.waterEvidenceImage')}</label>
          <input
            id="waterImage"
            name="waterImage"
            type="file"
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              onChange={(event) => onImageChange(event.target.files?.[0] || null)}
            />
        </div>
      </div>
    </fieldset>
  );
}

function MeterDisplay({ label, value }) {
  return (
    <div className="utility-meter-field">
      <div className="meter-field-label">
        <span>{label}</span>
      </div>
      <div className="meter-readonly-value" aria-label={label}>
        <strong>{formatNumber(value)}</strong>
      </div>
    </div>
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

function normalizeFetchedMeter(reading, meterType) {
  if (reading.oldReading !== undefined && reading.newReading !== undefined) {
    return {
      oldReading: reading.oldReading,
      newReading: reading.newReading,
      usage: reading.usage
    };
  }

  if (meterType === 'electricity') {
    return {
      oldReading: reading.oldElectricity,
      newReading: reading.newElectricity,
      usage: reading.electricityUsage
    };
  }

  return {
    oldReading: reading.oldWater,
    newReading: reading.newWater,
    usage: reading.waterUsage
  };
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
