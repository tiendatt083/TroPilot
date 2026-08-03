/** Tạo tên class CSS theo trạng thái hóa đơn để hiển thị màu nhãn phù hợp. */
export function getInvoiceStatusClass(status) {
  return `status-pill invoice-status-${String(status || 'UNPAID').toLowerCase().replaceAll('_', '-')}`;
}
