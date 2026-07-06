import { localizedOption } from './interfaceTranslations.js';

export const INVOICE_STATUS_OPTIONS = [
  localizedOption('UNPAID', 'Unpaid'),
  localizedOption('PENDING_CONFIRMATION', 'Pending confirmation'),
  localizedOption('PAID', 'Paid'),
  localizedOption('OVERDUE', 'Overdue'),
  localizedOption('REJECTED', 'Rejected')
];

export function getInvoiceStatusLabel(status) {
  return INVOICE_STATUS_OPTIONS.find((option) => option.value === status)?.label || status;
}

export function getInvoiceStatusClass(status) {
  return `status-pill invoice-status-${String(status || 'UNPAID').toLowerCase().replaceAll('_', '-')}`;
}
