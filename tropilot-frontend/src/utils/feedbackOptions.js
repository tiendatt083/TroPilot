import { formatDisplayDateTime } from './dateFormat.js';

export const FEEDBACK_TYPE_OPTIONS = [
  { value: 'GENERAL', label: 'General' },
  { value: 'CONTRACT_ERROR', label: 'Contract error' },
  { value: 'OTHER', label: 'Other' }
];

export const FEEDBACK_STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'REJECTED', label: 'Rejected' }
];

export function getFeedbackTypeLabel(type) {
  if (type === 'INVOICE_COMPLAINT') {
    return 'Invoice complaint';
  }

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
    return 'Not provided';
  }

  return formatDisplayDateTime(value, 'Not provided');
}
