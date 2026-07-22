import { localizedOption } from './interfaceTranslations.js';

export const TASK_TYPE_OPTIONS = [
  localizedOption('METER_READING', 'Meter reading'),
  localizedOption('INVOICE_CREATION', 'Invoice creation'),
  localizedOption('ROOM_CHECK', 'Room check'),
  localizedOption('SHARED_EQUIPMENT_CHECK', 'Shared equipment check'),
  localizedOption('OTHER', 'Other')
];

export const TASK_STATUS_OPTIONS = [
  localizedOption('NEW', 'Assigned'),
  localizedOption('IN_PROGRESS', 'In progress'),
  localizedOption('COMPLETED', 'Completed'),
  localizedOption('OVERDUE', 'Overdue')
];

export function getTaskStatusClass(status) {
  return `status-pill task-status-${String(status || 'NEW').toLowerCase().replaceAll('_', '-')}`;
}

export function toDateInputValue(value) {
  if (!value) {
    return '';
  }

  return String(value).slice(0, 10);
}

export function toDeadlinePayload(value) {
  if (!value) {
    return '';
  }

  return String(value).includes('T') ? value : `${value}T23:59:00`;
}
