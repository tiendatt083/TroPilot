export function getReceiptStatusClass(status) {
  return `status-pill receipt-status-${String(status || 'VALID').toLowerCase()}`;
}
