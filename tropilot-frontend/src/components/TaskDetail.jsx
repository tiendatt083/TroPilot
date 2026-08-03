import { useTranslation } from 'react-i18next';
import {
  getTaskStatusClass,
} from '../utils/taskOptions.js';
import LineIcon from './common/LineIcon.jsx';
import { openFileUrl, resolveFileUrl } from '../utils/fileUrl.js';
import { formatDate, formatEnumLabel } from '../utils/i18nFormat.js';
import { formatRoomLabel } from '../utils/roomDisplay.js';

/** Tạo nhãn phòng liên quan tới công việc. */
function roomText(task, t) {
  if (!task.roomCode) {
    return task.buildingId || task.buildingCode
      ? t('forms.task.generalBuildingTask')
      : t('forms.task.noRoomLinked');
  }

  return formatRoomLabel(task);
}

/** Một ô thông tin có biểu tượng trong phần chi tiết công việc. */
function DetailItem({ icon, tone = 'blue', label, children, className = '' }) {
  return (
    <div className={['task-detail-field', className].filter(Boolean).join(' ')}>
      <span className={`task-detail-icon task-detail-icon-${tone}`} aria-hidden="true">
        <LineIcon name={icon} />
      </span>
      <div className="task-detail-copy">
        <span>{label}</span>
        <strong>{children}</strong>
      </div>
    </div>
  );
}

/** Hiển thị toàn bộ thông tin, hạn xử lý và kết quả của một công việc vận hành. */
export default function TaskDetail({ task }) {
  const { t } = useTranslation();

  if (!task) {
    return <div className="empty-state">{t('details.selectTask')}</div>;
  }

  return (
    <section className="task-detail-panel">
      <div className="detail-panel task-detail-card">
        <div className="task-detail-title-field">
          <span className="task-detail-icon task-detail-icon-blue" aria-hidden="true">
            <LineIcon name="fileText" />
          </span>
          <div className="task-detail-copy">
            <span>{t('details.title')}</span>
            <strong>{task.title}</strong>
          </div>
        </div>
        <DetailItem
          className="task-detail-status-field"
          icon="checkShield"
          label={t('tables.common.status')}
          tone={task.status === 'COMPLETED' ? 'green' : 'amber'}
        >
            <span className={getTaskStatusClass(task.status)}>{formatEnumLabel(t, 'taskStatus', task.status)}</span>
        </DetailItem>
        <DetailItem icon="menu" label={t('tables.common.type')} tone="violet">
          {formatEnumLabel(t, 'taskType', task.taskType)}
        </DetailItem>
        <DetailItem icon="user" label={t('tables.common.assignedStaff')} tone="blue">
          {task.assignedToName}
        </DetailItem>
        <DetailItem icon="mail" label={t('details.staffEmail')} tone="cyan">
          {task.assignedToEmail}
        </DetailItem>
        <DetailItem icon="home" label={t('tables.common.room')} tone="indigo">
          {roomText(task, t)}
        </DetailItem>
        <DetailItem icon="building" label={t('tables.common.building')} tone="blue">
          {task.buildingCode ? `${task.buildingCode} - ${task.buildingName}` : t('common.notLinked')}
        </DetailItem>
        <DetailItem icon="calendar" label={t('tables.common.deadline')} tone="amber">
          {formatDate(task.deadline, t)}
        </DetailItem>
        <DetailItem icon="userCheck" label={t('tables.common.createdBy')} tone="green">
          {task.createdByName}
        </DetailItem>
      </div>

      <div className="task-detail-note-grid">
        <div className="task-detail-note-field">
          <span className="task-detail-icon task-detail-icon-blue" aria-hidden="true">
            <LineIcon name="fileText" />
          </span>
          <div className="task-detail-copy">
            <span>{t('tables.common.content')}</span>
            <p>{task.content}</p>
          </div>
        </div>
        <div className="task-detail-note-field task-detail-result-field">
          <span className="task-detail-icon task-detail-icon-cyan" aria-hidden="true">
            <LineIcon name="feedback" />
          </span>
          <div className="task-detail-copy">
            <span>{t('tables.common.resultNote')}</span>
            <p>{task.resultNote || t('details.noResultNote')}</p>
          </div>
        </div>
        {task.resultImageUrl && (
          <div className="task-detail-note-field">
            <span className="task-detail-icon task-detail-icon-violet" aria-hidden="true">
              <LineIcon name="image" />
            </span>
            <div className="task-detail-copy">
              <span>{t('tables.common.resultImage')}</span>
              <a className="secondary-link compact-link" href={resolveFileUrl(task.resultImageUrl)} target="_blank" rel="noreferrer" onClick={(event) => openFileUrl(task.resultImageUrl, event)}>
                {t('details.viewImage')}
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
