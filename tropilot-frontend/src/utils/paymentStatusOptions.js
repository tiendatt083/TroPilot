import { localizedOption } from './interfaceTranslations.js';

export const PAYMENT_STATUS_OPTIONS = [
  localizedOption('PENDING', 'Pending'),
  localizedOption('APPROVED', 'Approved'),
  localizedOption('REJECTED', 'Rejected')
];

export const RECEIPT_STATUS_OPTIONS = [
  localizedOption('VALID', 'Valid'),
  localizedOption('CANCELLED', 'Cancelled')
];

export function getPaymentStatusLabel(status) {
  return PAYMENT_STATUS_OPTIONS.find((option) => option.value === status)?.label || status;
}

export function getPaymentStatusClass(status) {
  return `status-pill payment-status-${String(status || 'PENDING').toLowerCase()}`;
}

export function getReceiptStatusLabel(status) {
  return RECEIPT_STATUS_OPTIONS.find((option) => option.value === status)?.label || status;
}

export function getReceiptStatusClass(status) {
  return `status-pill receipt-status-${String(status || 'VALID').toLowerCase()}`;
}
