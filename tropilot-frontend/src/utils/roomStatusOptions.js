export const ROOM_STATUS_OPTIONS = [
  { value: 'EMPTY', label: 'Empty' },
  { value: 'OCCUPIED', label: 'Occupied' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'RESERVED', label: 'Reserved' }
];

export function getRoomStatusLabel(status) {
  return ROOM_STATUS_OPTIONS.find((option) => option.value === status)?.label || status;
}
