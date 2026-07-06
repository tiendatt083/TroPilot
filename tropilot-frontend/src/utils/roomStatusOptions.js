import { localizedOption } from './interfaceTranslations.js';

export const ROOM_STATUS_OPTIONS = [
  localizedOption('EMPTY', 'Empty'),
  localizedOption('OCCUPIED', 'Occupied'),
  localizedOption('MAINTENANCE', 'Maintenance'),
  localizedOption('RESERVED', 'Reserved')
];

export function getRoomStatusLabel(status) {
  return ROOM_STATUS_OPTIONS.find((option) => option.value === status)?.label || status;
}
