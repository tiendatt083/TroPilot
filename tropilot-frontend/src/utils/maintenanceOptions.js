import { localizedOption } from './interfaceTranslations.js';

export const MAINTENANCE_STATUS_OPTIONS = [
  localizedOption('PENDING', 'Pending'),
  localizedOption('ASSIGNED', 'Assigned'),
  localizedOption('IN_PROGRESS', 'In progress'),
  localizedOption('COMPLETED', 'Completed')
];

export function getMaintenanceStatusClass(status) {
  return `status-pill maintenance-status-${String(status || 'PENDING').toLowerCase().replaceAll('_', '-')}`;
}
