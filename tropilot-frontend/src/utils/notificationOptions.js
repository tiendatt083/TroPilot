import { formatDisplayDateTime } from './dateFormat.js';
import { localizedOption, translateInterfaceText } from './interfaceTranslations.js';

export const NOTIFICATION_TARGET_OPTIONS = [
  localizedOption('ALL_RESIDENT_HEADS', 'All Head Residents'),
  localizedOption('ALL', 'All users'),
  localizedOption('STAFF', 'All Staff'),
  localizedOption('SELECTED_USERS', 'Selected users')
];

const legacyNotificationTargetLabels = {
  ONE_BUILDING: 'One building',
  ONE_ROOM: 'One room',
  ONE_USER: 'One user'
};

export function getNotificationTargetLabel(targetType) {
  return translateInterfaceText(
    NOTIFICATION_TARGET_OPTIONS.find((option) => option.value === targetType)?.label ||
    legacyNotificationTargetLabels[targetType] ||
    targetType
  );
}

export function getNotificationBuildingLabel(notification) {
  if (notification.allBuildings) {
    return translateInterfaceText('All buildings');
  }

  return notification.buildingNames?.length
    ? notification.buildingNames.join(', ')
    : translateInterfaceText('Selected buildings');
}

export function formatNotificationDateTime(value) {
  if (!value) {
    return translateInterfaceText('Not provided');
  }

  return formatDisplayDateTime(value, translateInterfaceText('Not provided'));
}
