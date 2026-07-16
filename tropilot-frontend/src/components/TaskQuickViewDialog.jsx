import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ActionDialog from './common/ActionDialog.jsx';
import LineIcon from './common/LineIcon.jsx';
import TaskForm from './TaskForm.jsx';
import {
  getTaskStatusClass,
} from '../utils/taskOptions.js';
import { formatDateTime, formatEnumLabel } from '../utils/i18nFormat.js';
import { formatRoomLabel } from '../utils/roomDisplay.js';

function roomText(task, t) {
  if (!task.roomCode) {
    return task.buildingId || task.buildingCode
      ? t('forms.task.generalBuildingTask')
      : t('forms.task.noRoomLinked');
  }

  return formatRoomLabel(task);
}

function DetailItem({ label, value, wide = false }) {
  return (
    <div className={wide ? 'task-quick-detail-item task-quick-detail-item-wide' : 'task-quick-detail-item'}>
      <span>{label}</span>
      <p>{value || '-'}</p>
    </div>
  );
}

export default function TaskQuickViewDialog({
  error,
  loading,
  message,
  onClose,
  onSubmit,
  open,
  roomPlaceholder,
  rooms,
  staffUsers,
  task
}) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (open) {
      setEditing(false);
    }
  }, [open, task?.id]);

  if (!task) {
    return null;
  }

  const handleSubmit = async (payload) => {
    const saved = await onSubmit(payload);
    if (saved !== false) {
      setEditing(false);
    }
  };

  return (
    <ActionDialog
      className="action-dialog-wide task-quick-dialog"
      eyebrow={editing ? t('taskManagement.editEyebrow') : t('taskManagement.detailsTitle')}
      labelledBy="task-quick-dialog-title"
      open={open}
      title={task.title}
      onClose={onClose}
    >
      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {editing ? (
        <div className="task-quick-edit">
          <TaskForm
            initialValues={task}
            rooms={rooms}
            staffUsers={staffUsers}
            loading={loading}
            submitLabel={t('common.saveChanges')}
            includeStatus
            roomPlaceholder={roomPlaceholder}
            onSubmit={handleSubmit}
          />
          <button className="task-quick-secondary-button" type="button" disabled={loading} onClick={() => setEditing(false)}>
            {t('common.cancel')}
          </button>
        </div>
      ) : (
        <div className="task-quick-view">
          <div className="task-quick-summary">
            <div>
              <span className="task-quick-label">{t('tables.common.status')}</span>
              <span className={getTaskStatusClass(task.status)}>{formatEnumLabel(t, 'taskStatus', task.status)}</span>
            </div>
            <button className="button-link task-quick-edit-button" type="button" onClick={() => setEditing(true)}>
              <LineIcon name="edit" size={16} />
              {t('common.edit')}
            </button>
          </div>

          <div className="task-quick-detail-grid">
            <DetailItem label={t('tables.common.type')} value={formatEnumLabel(t, 'taskType', task.taskType)} />
            <DetailItem label={t('tables.common.room')} value={roomText(task, t)} />
            <DetailItem label={t('tables.common.assignedStaff')} value={task.assignedToName} />
            <DetailItem label={t('details.staffEmail')} value={task.assignedToEmail} />
            <DetailItem label={t('tables.common.deadline')} value={formatDateTime(task.deadline, t)} />
            <DetailItem label={t('tables.common.createdBy')} value={task.createdByName} />
            <DetailItem label={t('tables.common.content')} value={task.content} wide />
            {task.resultNote && <DetailItem label={t('tables.common.resultNote')} value={task.resultNote} wide />}
          </div>
        </div>
      )}
    </ActionDialog>
  );
}
