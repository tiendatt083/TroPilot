/** Tạo tên class CSS cho nhãn trạng thái của biên lai thanh toán. */
export function getReceiptStatusClass(status) {
  return `status-pill receipt-status-${String(status || 'VALID').toLowerCase()}`;
}
