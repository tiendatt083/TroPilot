import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  getTaskStatusClass,
} from '../utils/taskOptions.js';
import LineIcon from './common/LineIcon.jsx';
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

export default function TaskTable({ tasks, detailBasePath, showAssignedStaff = true }) {
  const { t } = useTranslation();

  return (
    <div className="table-wrap">
      <table className="data-table task-table">
        <thead>
          <tr>
            <th>{t('tables.tasks.title')}</th>
            <th>{t('tables.common.room')}</th>
            {showAssignedStaff && <th>{t('tables.common.assignedStaff')}</th>}
            <th>{t('tables.common.type')}</th>
            <th>{t('tables.common.deadline')}</th>
            <th>{t('tables.common.status')}</th>
            <th>{t('tables.common.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id}>
              <td>
                <strong>{task.title}</strong>
                <span className="table-subtext">{task.content}</span>
              </td>
              <td>
                <strong>{roomText(task, t)}</strong>
                <span className="table-subtext">{task.buildingCode || t('common.noBuilding')}</span>
              </td>
              {showAssignedStaff && (
                <td>
                  <strong>{task.assignedToName}</strong>
                  <span className="table-subtext">{task.assignedToEmail}</span>
                </td>
              )}
              <td>{formatEnumLabel(t, 'taskType', task.taskType)}</td>
              <td>{formatDateTime(task.deadline, t)}</td>
              <td>
                <span className={getTaskStatusClass(task.status)}>
                  {formatEnumLabel(t, 'taskStatus', task.status)}
                </span>
              </td>
              <td>
                <Link
                  className="table-icon-button"
                  to={`${detailBasePath}/${task.id}`}
                  aria-label={t('common.view')}
                  title={t('common.view')}
                >
                  <LineIcon name="eye" size={16} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {tasks.length === 0 && <div className="empty-state flat-empty-state">{t('tables.tasks.empty')}</div>}
    </div>
  );
}
