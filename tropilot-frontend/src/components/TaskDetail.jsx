import { useTranslation } from 'react-i18next';
import {
  getTaskStatusClass,
} from '../utils/taskOptions.js';
import { resolveFileUrl } from '../utils/fileUrl.js';
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

export default function TaskDetail({ task }) {
  const { t } = useTranslation();

  if (!task) {
    return <div className="empty-state">{t('details.selectTask')}</div>;
  }

  return (
    <section className="task-detail-panel">
      <div className="detail-panel">
        <div>
          <span>{t('details.title')}</span>
          <strong>{task.title}</strong>
        </div>
        <div>
          <span>{t('tables.common.status')}</span>
          <strong>
            <span className={getTaskStatusClass(task.status)}>{formatEnumLabel(t, 'taskStatus', task.status)}</span>
          </strong>
        </div>
        <div>
          <span>{t('tables.common.type')}</span>
          <strong>{formatEnumLabel(t, 'taskType', task.taskType)}</strong>
        </div>
        <div>
          <span>{t('tables.common.assignedStaff')}</span>
          <strong>{task.assignedToName}</strong>
        </div>
        <div>
          <span>{t('details.staffEmail')}</span>
          <strong>{task.assignedToEmail}</strong>
        </div>
        <div>
          <span>{t('tables.common.room')}</span>
          <strong>{roomText(task, t)}</strong>
        </div>
        <div>
          <span>{t('tables.common.building')}</span>
          <strong>{task.buildingCode ? `${task.buildingCode} - ${task.buildingName}` : t('common.notLinked')}</strong>
        </div>
        <div>
          <span>{t('tables.common.deadline')}</span>
          <strong>{formatDateTime(task.deadline, t)}</strong>
        </div>
        <div>
          <span>{t('tables.common.createdBy')}</span>
          <strong>{task.createdByName}</strong>
        </div>
        <div className="detail-wide">
          <span>{t('tables.common.content')}</span>
          <p>{task.content}</p>
        </div>
        <div className="detail-wide">
          <span>{t('tables.common.resultNote')}</span>
          <p>{task.resultNote || t('details.noResultNote')}</p>
        </div>
        {task.resultImageUrl && (
          <div className="detail-wide">
            <span>{t('tables.common.resultImage')}</span>
            <a className="secondary-link compact-link" href={resolveFileUrl(task.resultImageUrl)} target="_blank" rel="noreferrer">
              {t('details.viewImage')}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
