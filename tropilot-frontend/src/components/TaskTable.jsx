import { Link } from 'react-router-dom';
import {
  formatTaskDateTime,
  getTaskPriorityClass,
  getTaskPriorityLabel,
  getTaskStatusClass,
  getTaskStatusLabel,
  getTaskTypeLabel
} from '../utils/taskOptions.js';

function roomText(task) {
  if (!task.roomCode) {
    return 'Not linked';
  }

  return `${task.roomCode} - ${task.roomName}`;
}

export default function TaskTable({ tasks, detailBasePath }) {
  return (
    <div className="table-wrap">
      <table className="data-table task-table">
        <thead>
          <tr>
            <th>Task</th>
            <th>Room</th>
            <th>Assigned staff</th>
            <th>Type</th>
            <th>Priority</th>
            <th>Deadline</th>
            <th>Status</th>
            <th>Actions</th>
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
                <strong>{roomText(task)}</strong>
                <span className="table-subtext">{task.buildingCode || 'No building'}</span>
              </td>
              <td>
                <strong>{task.assignedToName}</strong>
                <span className="table-subtext">{task.assignedToEmail}</span>
              </td>
              <td>{getTaskTypeLabel(task.taskType)}</td>
              <td>
                <span className={getTaskPriorityClass(task.priority)}>
                  {getTaskPriorityLabel(task.priority)}
                </span>
              </td>
              <td>{formatTaskDateTime(task.deadline)}</td>
              <td>
                <span className={getTaskStatusClass(task.status)}>
                  {getTaskStatusLabel(task.status)}
                </span>
              </td>
              <td>
                <Link className="secondary-link compact-link" to={`${detailBasePath}/${task.id}`}>
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {tasks.length === 0 && <div className="empty-state flat-empty-state">No tasks found.</div>}
    </div>
  );
}
