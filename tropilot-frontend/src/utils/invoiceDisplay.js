/** Đổi các nhãn cố định của hóa đơn sang bản dịch tương ứng, nhưng vẫn giữ nguyên giá trị khi chưa có bản dịch. */
export function formatInvoiceText(t, value) {
  if (!value) {
    return value;
  }

  const key = String(value).replaceAll(' ', '_');
  return t(`invoiceText.${key}`, { defaultValue: value });
}

/** Định dạng số tiền hoặc số lượng trên hóa đơn với dấu phân tách hàng nghìn. */
export function formatInvoiceAmount(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue)
    ? numberValue.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : value;
}
