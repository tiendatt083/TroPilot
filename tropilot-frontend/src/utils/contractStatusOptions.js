/** Tạo tên class CSS từ trạng thái hợp đồng để nhãn trạng thái nhận đúng kiểu và màu. */
export function getContractStatusClass(status) {
  return `status-pill contract-status-${String(status || 'not-uploaded').toLowerCase().replaceAll('_', '-')}`;
}
