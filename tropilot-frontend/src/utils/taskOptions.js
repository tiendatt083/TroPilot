import { localizedOption } from './interfaceTranslations.js';

/** Các loại công việc vận hành mà nhân viên có thể được giao. */
export const TASK_TYPE_OPTIONS = [
  localizedOption('METER_READING', 'Meter reading'),
  localizedOption('INVOICE_CREATION', 'Invoice creation'),
  localizedOption('ROOM_CHECK', 'Room check'),
  localizedOption('SHARED_EQUIPMENT_CHECK', 'Shared equipment check'),
  localizedOption('OTHER', 'Other')
];

/** Các trạng thái vòng đời của một công việc. */
export const TASK_STATUS_OPTIONS = [
  localizedOption('NEW', 'Assigned'),
  localizedOption('IN_PROGRESS', 'In progress'),
  localizedOption('COMPLETED', 'Completed'),
  localizedOption('OVERDUE', 'Overdue')
];

/** Tạo class CSS theo trạng thái công việc cho nhãn màu trên giao diện. */
export function getTaskStatusClass(status) {
  return `status-pill task-status-${String(status || 'NEW').toLowerCase().replaceAll('_', '-')}`;
}

/** Cắt ngày giờ API về yyyy-MM-dd để đặt vào ô nhập ngày. */
export function toDateInputValue(value) {
  if (!value) {
    return '';
  }

  return String(value).slice(0, 10);
}

/** Thêm giờ cuối ngày khi người dùng chỉ chọn ngày hạn xử lý. */
export function toDeadlinePayload(value) {
  if (!value) {
    return '';
  }

  return String(value).includes('T') ? value : `${value}T23:59:00`;
}
