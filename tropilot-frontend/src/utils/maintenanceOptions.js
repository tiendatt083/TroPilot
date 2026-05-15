export const MAINTENANCE_STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'REJECTED', label: 'Rejected' }
];

export function getMaintenanceStatusLabel(status) {
  return MAINTENANCE_STATUS_OPTIONS.find((option) => option.value === status)?.label || status;
}

export function getMaintenanceStatusClass(status) {
  return `status-pill maintenance-status-${String(status || 'PENDING').toLowerCase().replaceAll('_', '-')}`;
}

export function formatMaintenanceDateTime(value) {
  if (!value) {
    return 'Not provided';
  }

  return String(value).replace('T', ' ').slice(0, 16);
}
