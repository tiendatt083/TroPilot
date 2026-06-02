import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_OPTIONS,
  TASK_TYPE_OPTIONS,
  toDateTimeInputValue
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

export default function TaskForm({
  initialValues,
  rooms,
  staffUsers,
  loading,
  submitLabel,
  includeStatus = false,
  roomRequired = false,
  roomPlaceholder,
  onSubmit
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    setForm({
      ...emptyForm,
      ...initialValues,
      roomId: initialValues?.roomId || '',
      assignedToId: initialValues?.assignedToId || '',
      deadline: toDateTimeInputValue(initialValues?.deadline)
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
      deadline: form.deadline,
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
      <textarea id="content" name="content" rows="5" value={form.content} onChange={handleChange} required />

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
          <label htmlFor="priority">{t('tables.common.priority')}</label>
          <select id="priority" name="priority" value={form.priority} onChange={handleChange} required>
            {TASK_PRIORITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {formatEnumLabel(t, 'taskPriority', option.value)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-grid">
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
        <div>
          <label htmlFor="deadline">{t('tables.common.deadline')}</label>
          <input
            id="deadline"
            name="deadline"
            type="datetime-local"
            lang="en-GB"
            value={form.deadline}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <label htmlFor="roomId">{t('tables.common.room')}</label>
      <select id="roomId" name="roomId" value={form.roomId} onChange={handleChange} required={roomRequired}>
        <option value="">{roomPlaceholder || t('forms.task.noRoomLinked')}</option>
        {rooms.map((room) => (
          <option key={room.id} value={room.id}>
            {formatRoomLabel(room)}
          </option>
        ))}
      </select>

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

      <button type="submit" disabled={loading}>
        {loading ? t('common.saving') : submitLabel}
      </button>
    </form>
  );
}
