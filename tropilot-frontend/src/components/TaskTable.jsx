import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  getTaskStatusClass,
} from '../utils/taskOptions.js';
import LineIcon from './common/LineIcon.jsx';
import { formatDate, formatEnumLabel } from '../utils/i18nFormat.js';
import { formatRoomLabel } from '../utils/roomDisplay.js';

function roomText(task, t) {
  if (!task.roomCode) {
    return task.buildingId || task.buildingCode
      ? t('forms.task.generalBuildingTask')
      : t('forms.task.noRoomLinked');
  }

  return formatRoomLabel(task);
}

function buildingText(task, t) {
  if (task.buildingCode && task.buildingName) {
    return `${task.buildingCode} - ${task.buildingName}`;
  }

  return task.buildingName || task.buildingCode || t('common.noBuilding');
}

export default function TaskTable({
  detailBasePath,
  onViewTask,
  onDeleteTask,
  deletingTaskId,
  showAssignedStaff = true,
  showBuilding = false,
  tasks
}) {
  const { t } = useTranslation();
  const canDeleteTask = (task) => Boolean(onDeleteTask) && !['IN_PROGRESS', 'COMPLETED'].includes(task.status);

  return (
    <div className="table-wrap">
      <table className="data-table task-table">
        <thead>
          <tr>
            <th>{t('tables.tasks.title')}</th>
            {showBuilding && <th>{t('tables.common.building')}</th>}
            <th>{t('tables.common.room')}</th>
            {showAssignedStaff && <th>{t('tables.common.assignedStaff')}</th>}
            <th>{t('tables.common.type')}</th>
            <th>{t('tables.common.deadline')}</th>
            <th>{t('tables.common.status')}</th>
            <th className="task-actions-column">{t('tables.common.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id}>
              <td>
                <strong>{task.title}</strong>
              </td>
              {showBuilding && (
                <td>
                  <strong>{buildingText(task, t)}</strong>
                </td>
              )}
              <td>
                <strong>{roomText(task, t)}</strong>
                {!showBuilding && (
                  <span className="table-subtext">{task.buildingCode || t('common.noBuilding')}</span>
                )}
              </td>
              {showAssignedStaff && (
                <td>
                  <strong>{task.assignedToName}</strong>
                  <span className="table-subtext">{task.assignedToEmail}</span>
                </td>
              )}
              <td>{formatEnumLabel(t, 'taskType', task.taskType)}</td>
              <td>{formatDate(task.deadline, t)}</td>
              <td>
                <span className={getTaskStatusClass(task.status)}>
                  {formatEnumLabel(t, 'taskStatus', task.status)}
                </span>
              </td>
              <td className="task-actions-cell">
                {onViewTask ? (
                  <div className="table-action-buttons">
                    <button
                      className="icon-action-button"
                      data-tooltip={t('common.view')}
                      type="button"
                      aria-label={t('common.view')}
                      onClick={() => onViewTask(task)}
                    >
                      <LineIcon name="eye" size={16} />
                    </button>
                    {onDeleteTask && (
                      <button
                        className="icon-action-button icon-action-danger"
                        data-tooltip={t('common.delete')}
                        type="button"
                        aria-label={t('common.delete')}
                        disabled={!canDeleteTask(task) || deletingTaskId === task.id}
                        onClick={() => onDeleteTask(task)}
                      >
                        <LineIcon name="trash" size={16} />
                      </button>
                    )}
                  </div>
                ) : (
                  <Link
                    className="icon-action-button"
                    data-tooltip={t('common.view')}
                    to={`${detailBasePath}/${task.id}`}
                    aria-label={t('common.view')}
                  >
                    <LineIcon name="eye" size={16} />
                  </Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {tasks.length === 0 && <div className="empty-state flat-empty-state">{t('tables.tasks.empty')}</div>}
    </div>
  );
}
