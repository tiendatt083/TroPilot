export const NOTIFICATION_TARGET_OPTIONS = [
  { value: 'ALL_RESIDENT_HEADS', label: 'All Head Residents' },
  { value: 'ONE_BUILDING', label: 'One building' },
  { value: 'ONE_ROOM', label: 'One room' },
  { value: 'ONE_USER', label: 'One user' },
  { value: 'STAFF', label: 'All Staff' },
  { value: 'ALL', label: 'All users' }
];

export function getNotificationTargetLabel(targetType) {
  return NOTIFICATION_TARGET_OPTIONS.find((option) => option.value === targetType)?.label || targetType;
}

export function formatNotificationDateTime(value) {
  if (!value) {
    return 'Not provided';
  }

  return String(value).replace('T', ' ').slice(0, 16);
}
