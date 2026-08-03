import { localizedOption } from './interfaceTranslations.js';

/** Các loại người được phép đứng tên đăng ký xe. */
export const VEHICLE_OWNER_TYPE_OPTIONS = [
  localizedOption('RESIDENT_HEAD', 'Head Resident'),
  localizedOption('ROOM_MEMBER', 'Room Member')
];

/** Các loại phương tiện được hỗ trợ trong hệ thống. */
export const VEHICLE_TYPE_OPTIONS = [
  localizedOption('MOTORBIKE', 'Motorbike'),
  localizedOption('CAR', 'Car'),
  localizedOption('BICYCLE', 'Bicycle'),
  localizedOption('ELECTRIC_BIKE', 'Electric bike')
];

/** Tạo class CSS theo trạng thái đăng ký xe để hiển thị nhãn màu. */
export function getVehicleStatusClass(status) {
  return `status-pill vehicle-status-${String(status || 'pending').toLowerCase()}`;
}
