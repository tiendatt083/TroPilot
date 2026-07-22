export function getInvoiceStatusClass(status) {
  return `status-pill invoice-status-${String(status || 'UNPAID').toLowerCase().replaceAll('_', '-')}`;
}
