/** Phạm vi sở hữu thiết bị: của tòa nhà chung hoặc của một phòng cụ thể. */
export const EQUIPMENT_SCOPES = ['BUILDING', 'ROOM'];

/** Các tình trạng kỹ thuật có thể gán cho thiết bị. */
export const EQUIPMENT_CONDITIONS = [
  'GOOD',
  'UNDER_MAINTENANCE',
  'INACTIVE'
];

/** Tạo class CSS theo tình trạng thiết bị để hiển thị nhãn trạng thái. */
export function getEquipmentConditionClass(condition) {
  return `status-pill equipment-condition-${String(condition || 'inactive').toLowerCase()}`;
}
