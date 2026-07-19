import { formatDisplayDateTime } from './dateFormat.js';
import { localizedOption, translateInterfaceText } from './interfaceTranslations.js';

export const MAINTENANCE_STATUS_OPTIONS = [
  localizedOption('PENDING', 'Pending'),
  localizedOption('ASSIGNED', 'Assigned'),
  localizedOption('IN_PROGRESS', 'In progress'),
  localizedOption('COMPLETED', 'Completed')
];

export function getMaintenanceStatusLabel(status) {
  return MAINTENANCE_STATUS_OPTIONS.find((option) => option.value === status)?.label || status;
}

export function getMaintenanceStatusClass(status) {
  return `status-pill maintenance-status-${String(status || 'PENDING').toLowerCase().replaceAll('_', '-')}`;
}

export function formatMaintenanceDateTime(value) {
  if (!value) {
    return translateInterfaceText('Not provided');
  }

  return formatDisplayDateTime(value, translateInterfaceText('Not provided'));
}
