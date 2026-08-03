import { formatDisplayDate, formatDisplayDateTime } from './dateFormat.js';

/** Các hàm định dạng enum và ngày tháng có dùng hệ thống đa ngôn ngữ. */
export function formatFallbackEnumLabel(value) {
  if (!value) {
    return '';
  }

  return String(value)
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/** Lấy nhãn đã dịch cho một enum; nếu thiếu bản dịch thì dùng nhãn được tạo tự động. */
export function formatEnumLabel(t, group, value) {
  if (!value) {
    return t('common.notAvailable');
  }

  return t(`enum.${group}.${value}`, { defaultValue: formatFallbackEnumLabel(value) });
}

/** Hiển thị ngày giờ hoặc thông báo "chưa cung cấp" theo ngôn ngữ đang chọn. */
export function formatDateTime(value, t) {
  if (!value) {
    return t('common.notProvided');
  }

  return formatDisplayDateTime(value, t('common.notProvided'));
}

/** Hiển thị ngày hoặc thông báo "chưa cung cấp" theo ngôn ngữ đang chọn. */
export function formatDate(value, t) {
  if (!value) {
    return t('common.notProvided');
  }

  return formatDisplayDate(value, t('common.notProvided'));
}
