import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TASK_STATUS_OPTIONS,
  TASK_TYPE_OPTIONS,
  toDateInputValue,
  toDeadlinePayload
} from '../utils/taskOptions.js';
import { formatEnumLabel } from '../utils/i18nFormat.js';
import { formatRoomLabel } from '../utils/roomDisplay.js';

const emptyForm = {
  title: '',
  content: '',
  taskType: 'ROOM_CHECK',
  roomId: '',
  assignedToId: '',
  deadline: '',
  priority: 'MEDIUM',
  status: 'NEW'
};

/** Form tạo hoặc cập nhật công việc, gồm loại việc, người thực hiện, phòng/tòa nhà và hạn xử lý. */
export default function TaskForm({
  initialValues,
  rooms,
  staffUsers,
  loading,
  submitLabel,
  includeStatus = false,
  roomRequired = false,
  roomPlaceholder,
  onCancel,
  onSubmit
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    const initialStatus = TASK_STATUS_OPTIONS.some((option) => option.value === initialValues?.status)
      ? initialValues.status
      : emptyForm.status;

    setForm({
      ...emptyForm,
      ...initialValues,
      roomId: initialValues?.roomId || '',
      assignedToId: initialValues?.assignedToId || '',
      deadline: toDateInputValue(initialValues?.deadline),
      status: initialStatus
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

    const payload = {
      title: form.title,
      content: form.content,
      taskType: form.taskType,
      roomId: form.roomId ? Number(form.roomId) : null,
      assignedToId: form.assignedToId ? Number(form.assignedToId) : null,
      deadline: toDeadlinePayload(form.deadline),
      priority: form.priority
    };

    if (includeStatus) {
      payload.status = form.status;
    }

    onSubmit(payload);
  };

  return (
    <form className="panel-form task-form" onSubmit={handleSubmit}>
      <label htmlFor="title">{t('details.title')}</label>
      <input id="title" name="title" value={form.title} onChange={handleChange} maxLength={160} required />

      <label htmlFor="content">{t('tables.common.content')}</label>
      <textarea id="content" name="content" rows="3" value={form.content} onChange={handleChange} required />

      <div className="form-grid">
        <div>
          <label htmlFor="taskType">{t('forms.task.taskType')}</label>
          <select id="taskType" name="taskType" value={form.taskType} onChange={handleChange} required>
            {TASK_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {formatEnumLabel(t, 'taskType', option.value)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="assignedToId">{t('tables.common.assignedStaff')}</label>
          <select id="assignedToId" name="assignedToId" value={form.assignedToId} onChange={handleChange} required>
            <option value="">{t('forms.task.selectStaff')}</option>
            {staffUsers.map((staff) => (
              <option key={staff.id} value={staff.id}>
                {staff.fullName} - {staff.email}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-grid">
        <div>
          <label htmlFor="deadline">{t('tables.common.deadline')}</label>
          <input
            id="deadline"
            name="deadline"
            type="date"
            lang="en-GB"
            value={form.deadline}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label htmlFor="roomId">{t('forms.task.roomScope')}</label>
          <select id="roomId" name="roomId" value={form.roomId} onChange={handleChange} required={roomRequired}>
            <option value="">{roomPlaceholder || t('forms.task.generalBuildingTask')}</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {formatRoomLabel(room)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {includeStatus && (
        <>
          <label htmlFor="status">{t('tables.common.status')}</label>
          <select id="status" name="status" value={form.status} onChange={handleChange} required>
            {TASK_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {formatEnumLabel(t, 'taskStatus', option.value)}
              </option>
            ))}
          </select>
        </>
      )}

      <div className="form-button-row task-form-actions">
        {onCancel && (
          <button className="secondary-button" type="button" disabled={loading} onClick={onCancel}>
            {t('common.cancel')}
          </button>
        )}
        <button type="submit" disabled={loading}>
          {loading ? t('common.saving') : submitLabel}
        </button>
      </div>
    </form>
  );
}
