export const EQUIPMENT_SCOPES = ['BUILDING', 'ROOM'];

export const EQUIPMENT_CONDITIONS = [
  'GOOD',
  'UNDER_MAINTENANCE',
  'INACTIVE'
];

export function getEquipmentConditionClass(condition) {
  return `status-pill equipment-condition-${String(condition || 'inactive').toLowerCase()}`;
}
