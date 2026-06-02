import { formatDisplayDateTime } from './dateFormat.js';

export const TASK_TYPE_OPTIONS = [
  { value: 'METER_READING', label: 'Meter reading' },
  { value: 'INVOICE_CREATION', label: 'Invoice creation' },
  { value: 'ROOM_CHECK', label: 'Room check' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'VEHICLE_CHECK', label: 'Vehicle check' },
  { value: 'FEEDBACK_HANDLING', label: 'Feedback handling' },
  { value: 'OTHER', label: 'Other' }
];

export const TASK_PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' }
];

export const TASK_STATUS_OPTIONS = [
  { value: 'NEW', label: 'New' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'OVERDUE', label: 'Overdue' }
];

export function getTaskTypeLabel(taskType) {
  return TASK_TYPE_OPTIONS.find((option) => option.value === taskType)?.label || taskType;
}

export function getTaskPriorityLabel(priority) {
  return TASK_PRIORITY_OPTIONS.find((option) => option.value === priority)?.label || priority;
}

export function getTaskStatusLabel(status) {
  return TASK_STATUS_OPTIONS.find((option) => option.value === status)?.label || status;
}

export function getTaskStatusClass(status) {
  return `status-pill task-status-${String(status || 'NEW').toLowerCase().replaceAll('_', '-')}`;
}

export function getTaskPriorityClass(priority) {
  return `priority-pill task-priority-${String(priority || 'MEDIUM').toLowerCase()}`;
}

export function formatTaskDateTime(value) {
  if (!value) {
    return 'Not provided';
  }

  return formatDisplayDateTime(value, 'Not provided');
}

export function toDateTimeInputValue(value) {
  if (!value) {
    return '';
  }

  return String(value).slice(0, 16);
}
