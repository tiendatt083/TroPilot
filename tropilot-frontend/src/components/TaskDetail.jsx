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

export default function TaskDetail({ task }) {
  if (!task) {
    return <div className="empty-state">Select a task to view details.</div>;
  }

  return (
    <section className="task-detail-panel">
      <div className="detail-panel">
        <div>
          <span>Title</span>
          <strong>{task.title}</strong>
        </div>
        <div>
          <span>Status</span>
          <strong>
            <span className={getTaskStatusClass(task.status)}>{getTaskStatusLabel(task.status)}</span>
          </strong>
        </div>
        <div>
          <span>Type</span>
          <strong>{getTaskTypeLabel(task.taskType)}</strong>
        </div>
        <div>
          <span>Priority</span>
          <strong>
            <span className={getTaskPriorityClass(task.priority)}>
              {getTaskPriorityLabel(task.priority)}
            </span>
          </strong>
        </div>
        <div>
          <span>Assigned staff</span>
          <strong>{task.assignedToName}</strong>
        </div>
        <div>
          <span>Staff email</span>
          <strong>{task.assignedToEmail}</strong>
        </div>
        <div>
          <span>Room</span>
          <strong>{roomText(task)}</strong>
        </div>
        <div>
          <span>Building</span>
          <strong>{task.buildingCode ? `${task.buildingCode} - ${task.buildingName}` : 'Not linked'}</strong>
        </div>
        <div>
          <span>Deadline</span>
          <strong>{formatTaskDateTime(task.deadline)}</strong>
        </div>
        <div>
          <span>Created by</span>
          <strong>{task.createdByName}</strong>
        </div>
        <div className="detail-wide">
          <span>Content</span>
          <p>{task.content}</p>
        </div>
        <div className="detail-wide">
          <span>Result note</span>
          <p>{task.resultNote || 'No result note provided.'}</p>
        </div>
        {task.resultImageUrl && (
          <div className="detail-wide">
            <span>Result image</span>
            <a className="secondary-link compact-link" href={task.resultImageUrl} target="_blank" rel="noreferrer">
              View image
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
