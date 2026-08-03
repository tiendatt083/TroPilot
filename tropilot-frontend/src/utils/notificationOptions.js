import { localizedOption } from './interfaceTranslations.js';

/** Các phạm vi người nhận thông báo mà quản trị viên có thể chọn. */
export const NOTIFICATION_TARGET_OPTIONS = [
  localizedOption('ALL_RESIDENT_HEADS', 'All Head Residents'),
  localizedOption('ALL', 'All users'),
  localizedOption('STAFF', 'All Staff'),
  localizedOption('SELECTED_USERS', 'Selected users')
];
