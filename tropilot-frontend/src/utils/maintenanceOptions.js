import { localizedOption } from './interfaceTranslations.js';

/** Danh sách trạng thái bảo trì dùng chung trong các ô chọn; nhãn tự đổi theo ngôn ngữ. */
export const MAINTENANCE_STATUS_OPTIONS = [
  localizedOption('PENDING', 'Pending'),
  localizedOption('ASSIGNED', 'Assigned'),
  localizedOption('IN_PROGRESS', 'In progress'),
  localizedOption('COMPLETED', 'Completed')
];

/** Tạo tên class CSS theo trạng thái bảo trì để gắn màu cho nhãn hiển thị. */
export function getMaintenanceStatusClass(status) {
  return `status-pill maintenance-status-${String(status || 'PENDING').toLowerCase().replaceAll('_', '-')}`;
}
