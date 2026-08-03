/** Hiển thị số có dấu phân tách hàng nghìn; giữ nguyên giá trị nếu không thể chuyển thành số. */
export function formatNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue)
    ? numberValue.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : value;
}
