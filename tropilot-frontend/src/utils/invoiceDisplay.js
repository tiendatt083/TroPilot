export function formatInvoiceText(t, value) {
  if (!value) {
    return value;
  }

  const key = String(value).replaceAll(' ', '_');
  return t(`invoiceText.${key}`, { defaultValue: value });
}

export function formatInvoiceAmount(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue)
    ? numberValue.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : value;
}
