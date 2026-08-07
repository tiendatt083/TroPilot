import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  formatDateInputValue,
  formatDisplayDate,
  formatDisplayMonth
} from '../utils/dateFormat.js';
import { openFileUrl, resolveFileUrl } from '../utils/fileUrl.js';
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

/** Form ghi hoặc chỉnh sửa chỉ số điện nước, kèm ảnh bằng chứng và kiểm tra dữ liệu theo phòng/kỳ ghi. */
export default function UtilityReadingForm({
  rooms,
  readings = [],
  initialValues,
  loadingRooms = false,
  loading,
  mode = 'create',
  submitLabel,
  onFetchReadings,
  onFetchElectricityReading,
  onFetchWaterReading,
  onUsageMonthChange,
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
    const readingDate = normalizeReadingDate(initialValues);

    setForm({
      ...emptyForm,
      ...initialValues,
      roomId: initialValues?.roomId || '',
      // month tách biệt với readingDate: đây là tháng dùng để lập hóa đơn.
      month: initialValues?.month || '',
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
  }, [initialValues]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === 'roomId' || name === 'readingDate' || name === 'month') {
      setFetchError('');
    }

    setForm((current) => ({
      ...current,
      [name]: value,
      // Đổi tháng sử dụng có thể làm thay đổi danh sách phòng chưa ghi chỉ số.
      ...(name === 'month' && !editing ? { roomId: '' } : {})
    }));

    if (name === 'month' && !editing) {
      onUsageMonthChange?.(value);
    }
  };

  const previousReading = useMemo(
    () => findPreviousReading(readings, form.roomId, form.month, initialValues?.id),
    [readings, form.roomId, form.month, initialValues?.id]
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
      // Gửi cả hai giá trị: month dùng tính hóa đơn, readingDate là ngày ghi thực tế để đối chiếu.
      month: form.month,
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

  const usageMonthRequired = !editing && !form.month;
  const noEligibleRooms = !editing && form.month && rooms.length === 0;

  return (
    <form className="panel-form utility-reading-entry-form" onSubmit={handleSubmit}>
      <div className="utility-reading-shared-form">
        <div className="utility-reading-room-field">
          <label htmlFor="roomId">{t('tables.common.room')}</label>
          <select
            id="roomId"
            name="roomId"
            value={form.roomId}
            onChange={handleChange}
            required
            disabled={editing || usageMonthRequired || noEligibleRooms || loadingRooms}
          >
            <option value="">
              {usageMonthRequired
                ? t('forms.utilityReading.selectUsageMonthFirst')
                : noEligibleRooms
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

        <div className="utility-reading-month-field">
          <label htmlFor="month">{t('forms.utilityReading.usageMonth')}</label>
          <input
            id="month"
            name="month"
            type="month"
            value={form.month}
            onChange={handleChange}
            required
          />
        </div>

        <div className="utility-reading-date-field">
          <label htmlFor="readingDate">{t('forms.utilityReading.readingDateShort')}</label>
          <input
            id="readingDate"
            name="readingDate"
            type="date"
            lang="en-GB"
            value={form.readingDate}
            onChange={handleChange}
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
          selectedImage={electricityImage}
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
          selectedImage={waterImage}
          onChange={handleChange}
          onFetch={() => handleFetchMeter('water')}
          onImageChange={setWaterImage}
        />
      </div>

      {editing && (
        <div className="utility-reading-reason-field">
          <label htmlFor="editReason">{t('forms.utilityReading.editReasonShort')}</label>
          <textarea
            id="editReason"
            name="editReason"
            value={form.editReason}
            onChange={handleChange}
            maxLength={1000}
            rows="2"
            required
          />
        </div>
      )}

      <div className="button-row form-button-row">
        {onCancel && (
          <button className="secondary-button inline-button" type="button" onClick={onCancel}>
            {t('common.cancel')}
          </button>
        )}
        <button type="submit" disabled={loading || usageMonthRequired || noEligibleRooms || loadingRooms}>
          {loading ? t('common.saving') : submitLabel}
        </button>
      </div>
    </form>
  );
}

/** Nhóm trường nhập riêng cho chỉ số điện cũ, mới và ảnh bằng chứng điện. */
function ElectricityReadingSubform({
  form,
  t,
  loading,
  fetching,
  canFetch,
  selectedImage,
  onChange,
  onFetch,
  onImageChange
}) {
  return (
    <MeterReadingSection
      className="meter-form-electricity"
      icon="bolt"
      iconClassName="meter-icon-electricity"
      title={t('forms.utilityReading.electricitySectionTitle')}
      unit={t('forms.utilityReading.electricityUnit')}
      fetchLabel={t('forms.utilityReading.fetchElectricity')}
      oldLabel={t('forms.utilityReading.oldElectricity')}
      oldValue={form.oldElectricity}
      newLabel={t('forms.utilityReading.newElectricity')}
      newInputId="newElectricity"
      newInputName="newElectricity"
      newValue={form.newElectricity}
      evidenceId="electricityImage"
      evidenceName="electricityImage"
      evidenceLabel={t('forms.utilityReading.electricityEvidenceImage')}
      t={t}
      loading={loading}
      fetching={fetching}
      canFetch={canFetch}
      canUseFetch={Boolean(form.roomId && form.readingDate)}
      selectedImage={selectedImage}
      onChange={onChange}
      onFetch={onFetch}
      onImageChange={onImageChange}
    />
  );
}

/** Nhóm trường nhập riêng cho chỉ số nước cũ, mới và ảnh bằng chứng nước. */
function WaterReadingSubform({
  form,
  t,
  loading,
  fetching,
  canFetch,
  selectedImage,
  onChange,
  onFetch,
  onImageChange
}) {
  return (
    <MeterReadingSection
      className="meter-form-water"
      icon="droplet"
      iconClassName="meter-icon-water"
      title={t('forms.utilityReading.waterSectionTitle')}
      unit={t('forms.utilityReading.waterUnit')}
      fetchLabel={t('forms.utilityReading.fetchWater')}
      oldLabel={t('forms.utilityReading.oldWater')}
      oldValue={form.oldWater}
      newLabel={t('forms.utilityReading.newWater')}
      newInputId="newWater"
      newInputName="newWater"
      newValue={form.newWater}
      evidenceId="waterImage"
      evidenceName="waterImage"
      evidenceLabel={t('forms.utilityReading.waterEvidenceImage')}
      t={t}
      loading={loading}
      fetching={fetching}
      canFetch={canFetch}
      canUseFetch={Boolean(form.roomId && form.readingDate)}
      selectedImage={selectedImage}
      onChange={onChange}
      onFetch={onFetch}
      onImageChange={onImageChange}
    />
  );
}

/** Khung dùng chung cho từng loại đồng hồ điện hoặc nước trong form. */
function MeterReadingSection({
  className,
  icon,
  iconClassName,
  title,
  unit,
  fetchLabel,
  oldLabel,
  oldValue,
  newLabel,
  newInputId,
  newInputName,
  newValue,
  evidenceId,
  evidenceName,
  evidenceLabel,
  t,
  loading,
  fetching,
  canFetch,
  canUseFetch,
  selectedImage,
  onChange,
  onFetch,
  onImageChange
}) {
  return (
    <fieldset className={`utility-reading-meter-form ${className}`}>
      <legend>
        <span className="utility-reading-meter-title">
          <LineIcon name={icon} className={`utility-reading-meter-icon ${iconClassName}`} />
          {title}
          <span className="meter-title-unit">({unit})</span>
        </span>
        {canFetch && (
          <span className="meter-mock-control">
            <em>{t('forms.utilityReading.mockApi')}</em>
            <button
              className="secondary-button utility-reading-fetch-button"
              type="button"
              aria-label={
                fetching
                  ? t('forms.utilityReading.fetchingReadings')
                  : fetchLabel
              }
              title={
                fetching
                  ? t('forms.utilityReading.fetchingReadings')
                  : fetchLabel
              }
              onClick={onFetch}
              disabled={loading || fetching || !canUseFetch}
            >
              <LineIcon name="refresh" />
              <span className="visually-hidden">
                {fetching ? t('forms.utilityReading.fetchingReadings') : t('forms.utilityReading.fetchMeterShort')}
              </span>
            </button>
          </span>
        )}
      </legend>

      <div className="utility-reading-meter-form-body">
        <div className="utility-meter-reading-row">
          <MeterDisplay label={oldLabel} value={oldValue} />
          <div className="utility-meter-field">
            <div className="meter-field-label">
              <label htmlFor={newInputId}>{newLabel}</label>
            </div>
            <input
              className="utility-reading-meter-value-input"
              id={newInputId}
              name={newInputName}
              type="number"
              min="0"
              step="0.01"
              value={newValue}
              onChange={onChange}
              required
            />
          </div>
        </div>

        <EvidenceUpload
          id={evidenceId}
          name={evidenceName}
          label={evidenceLabel}
          selectedFile={selectedImage}
          t={t}
          onImageChange={onImageChange}
        />
      </div>
    </fieldset>
  );
}

/** Ô chọn tệp ảnh dùng làm bằng chứng cho một chỉ số đồng hồ. */
function EvidenceUpload({ id, name, label, selectedFile, t, onImageChange }) {
  return (
    <div className="utility-reading-evidence-field">
      <span className="utility-reading-evidence-label">{label}</span>
      <label className="utility-reading-upload-dropzone" htmlFor={id}>
        <LineIcon name="image" className="utility-reading-upload-icon" />
        <span>{selectedFile?.name || t('forms.utilityReading.chooseFileOrDrop')}</span>
      </label>
      <input
        className="utility-reading-file-input"
        id={id}
        name={name}
        type="file"
        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
        onChange={(event) => onImageChange(event.target.files?.[0] || null)}
      />
      <span className="utility-reading-upload-note">{t('forms.utilityReading.fileLimitShort')}</span>
    </div>
  );
}

/** Hiển thị một chỉ số đồng hồ ở chế độ chỉ đọc. */
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

/** Hiển thị ảnh bằng chứng của kỳ trước để người nhập đối chiếu chỉ số. */
function PreviousReadingEvidence({ previousReading, t }) {
  if (!previousReading) {
    return null;
  }

  const electricityImageUrl = previousReading.electricityImageUrl
    ? resolveFileUrl(previousReading.electricityImageUrl)
    : null;
  const waterImageUrl = previousReading.waterImageUrl
    ? resolveFileUrl(previousReading.waterImageUrl)
    : null;

  if (!electricityImageUrl && !waterImageUrl) {
    return null;
  }

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
          <a
            className="secondary-link compact-link previous-reading-image-link"
            href={electricityImageUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => openFileUrl(previousReading.electricityImageUrl, event)}
          >
            <LineIcon name="eye" />
            {t('forms.utilityReading.previousElectricityImage')}
          </a>
        )}
        {waterImageUrl && (
          <a
            className="secondary-link compact-link previous-reading-image-link"
            href={waterImageUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => openFileUrl(previousReading.waterImageUrl, event)}
          >
            <LineIcon name="eye" />
            {t('forms.utilityReading.previousWaterImage')}
          </a>
        )}
      </div>
    </div>
  );
}

/** Tìm bản ghi gần nhất trước kỳ đang nhập của cùng một phòng. */
function findPreviousReading(readings, roomId, selectedMonth, currentReadingId) {

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

/** Tạo giá trị thời gian để sắp xếp các bản ghi chỉ số. */
function getReadingSortValue(reading) {
  return reading.readingDate || (reading.month ? `${reading.month}-01` : '');
}

/** Chuẩn hóa dữ liệu điện hoặc nước từ API về cấu trúc form đang dùng. */
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

/** Chuẩn hóa ngày ghi thực tế; ngày này không bị ràng buộc với tháng sử dụng. */
function normalizeReadingDate(values) {
  if (values?.readingDate) {
    return values.readingDate;
  }

  if (values?.month) {
    return `${values.month}-01`;
  }

  return formatDateInputValue();
}
