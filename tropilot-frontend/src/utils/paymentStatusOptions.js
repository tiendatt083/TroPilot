export const PAYMENT_STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' }
];

export const RECEIPT_STATUS_OPTIONS = [
  { value: 'VALID', label: 'Valid' },
  { value: 'CANCELLED', label: 'Cancelled' }
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
