/** Đọc trạng thái hoạt động của phí dịch vụ, tương thích với cả hai tên trường backend từng dùng. */
export function isServiceFeeActive(serviceFee) {
  return Boolean(serviceFee.isActive ?? serviceFee.active);
}
