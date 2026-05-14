export const INVOICE_STATUS_OPTIONS = [
  { value: 'UNPAID', label: 'Unpaid' },
  { value: 'PENDING_CONFIRMATION', label: 'Pending confirmation' },
  { value: 'PAID', label: 'Paid' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'REJECTED', label: 'Rejected' }
];

export function getInvoiceStatusLabel(status) {
  return INVOICE_STATUS_OPTIONS.find((option) => option.value === status)?.label || status;
}

export function getInvoiceStatusClass(status) {
  return `status-pill invoice-status-${String(status || 'UNPAID').toLowerCase().replaceAll('_', '-')}`;
}
