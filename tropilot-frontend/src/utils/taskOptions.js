import { formatDisplayDateTime } from './dateFormat.js';
import { localizedOption, translateInterfaceText } from './interfaceTranslations.js';

export const TASK_TYPE_OPTIONS = [
  localizedOption('METER_READING', 'Meter reading'),
  localizedOption('INVOICE_CREATION', 'Invoice creation'),
  localizedOption('ROOM_CHECK', 'Room check'),
  localizedOption('MAINTENANCE', 'Maintenance'),
  localizedOption('VEHICLE_CHECK', 'Vehicle check'),
  localizedOption('FEEDBACK_HANDLING', 'Feedback handling'),
  localizedOption('OTHER', 'Other')
];

export const TASK_PRIORITY_OPTIONS = [
  localizedOption('LOW', 'Low'),
  localizedOption('MEDIUM', 'Medium'),
  localizedOption('HIGH', 'High'),
  localizedOption('URGENT', 'Urgent')
];

export const TASK_STATUS_OPTIONS = [
  localizedOption('NEW', 'New'),
  localizedOption('IN_PROGRESS', 'In progress'),
  localizedOption('COMPLETED', 'Completed'),
  localizedOption('REJECTED', 'Rejected'),
  localizedOption('OVERDUE', 'Overdue')
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
    return translateInterfaceText('Not provided');
  }

  return formatDisplayDateTime(value, translateInterfaceText('Not provided'));
}

export function toDateTimeInputValue(value) {
  if (!value) {
    return '';
  }

  return String(value).slice(0, 16);
}
