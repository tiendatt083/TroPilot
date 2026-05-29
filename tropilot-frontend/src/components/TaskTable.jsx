import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  getTaskPriorityClass,
  getTaskStatusClass,
} from '../utils/taskOptions.js';
import { formatDateTime, formatEnumLabel } from '../utils/i18nFormat.js';
import { formatRoomLabel } from '../utils/roomDisplay.js';

function roomText(task, t) {
  if (!task.roomCode) {
    return t('common.notLinked');
  }

  return formatRoomLabel(task);
}

export default function TaskTable({ tasks, detailBasePath }) {
  const { t } = useTranslation();

  return (
    <div className="table-wrap">
      <table className="data-table task-table">
        <thead>
          <tr>
            <th>{t('tables.tasks.title')}</th>
            <th>{t('tables.common.room')}</th>
            <th>{t('tables.common.assignedStaff')}</th>
            <th>{t('tables.common.type')}</th>
            <th>{t('tables.common.priority')}</th>
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
              <td>
                <strong>{task.assignedToName}</strong>
                <span className="table-subtext">{task.assignedToEmail}</span>
              </td>
              <td>{formatEnumLabel(t, 'taskType', task.taskType)}</td>
              <td>
                <span className={getTaskPriorityClass(task.priority)}>
                  {formatEnumLabel(t, 'taskPriority', task.priority)}
                </span>
              </td>
              <td>{formatDateTime(task.deadline, t)}</td>
              <td>
                <span className={getTaskStatusClass(task.status)}>
                  {formatEnumLabel(t, 'taskStatus', task.status)}
                </span>
              </td>
              <td>
                <Link className="secondary-link compact-link" to={`${detailBasePath}/${task.id}`}>
                  {t('common.view')}
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
