import { formatDisplayDateTime } from './dateFormat.js';
import { localizedOption, translateInterfaceText } from './interfaceTranslations.js';

export const FEEDBACK_TYPE_OPTIONS = [
  localizedOption('GENERAL', 'General'),
  localizedOption('MAINTENANCE', 'Maintenance'),
  localizedOption('INVOICE_COMPLAINT', 'Payment invoice'),
  localizedOption('CONTRACT_ERROR', 'Contract error'),
  localizedOption('OTHER', 'Other')
];

export const FEEDBACK_STATUS_OPTIONS = [
  localizedOption('PENDING', 'Pending'),
  localizedOption('IN_PROGRESS', 'In progress'),
  localizedOption('RESOLVED', 'Resolved')
];

export function getFeedbackTypeLabel(type) {
  return FEEDBACK_TYPE_OPTIONS.find((option) => option.value === type)?.label || type;
}

export function getFeedbackStatusLabel(status) {
  return FEEDBACK_STATUS_OPTIONS.find((option) => option.value === status)?.label || status;
}

export function getFeedbackStatusClass(status) {
  return `status-pill feedback-status-${String(status || 'PENDING').toLowerCase().replaceAll('_', '-')}`;
}

export function formatFeedbackDateTime(value) {
  if (!value) {
    return translateInterfaceText('Not provided');
  }

  return formatDisplayDateTime(value, translateInterfaceText('Not provided'));
}
