import { formatDisplayDateTime } from './dateFormat.js';

export const NOTIFICATION_TARGET_OPTIONS = [
  { value: 'ALL_RESIDENT_HEADS', label: 'All Head Residents' },
  { value: 'ALL', label: 'All users' },
  { value: 'STAFF', label: 'All Staff' },
  { value: 'SELECTED_USERS', label: 'Selected Head Residents' }
];

const legacyNotificationTargetLabels = {
  ONE_BUILDING: 'One building',
  ONE_ROOM: 'One room',
  ONE_USER: 'One user'
};

export function getNotificationTargetLabel(targetType) {
  return (
    NOTIFICATION_TARGET_OPTIONS.find((option) => option.value === targetType)?.label ||
    legacyNotificationTargetLabels[targetType] ||
    targetType
  );
}

export function getNotificationBuildingLabel(notification) {
  if (notification.allBuildings) {
    return 'All buildings';
  }

  return notification.buildingNames?.length ? notification.buildingNames.join(', ') : 'Selected buildings';
}

export function formatNotificationDateTime(value) {
  if (!value) {
    return 'Not provided';
  }

  return formatDisplayDateTime(value, 'Not provided');
}
