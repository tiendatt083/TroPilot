const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/;
const MONTH_PATTERN = /^(\d{4})-(\d{2})$/;
const TIME_PATTERN = /[T\s](\d{2}):(\d{2})/;

export function formatDisplayDate(value, fallback = '') {
  if (!value) {
    return fallback;
  }

  const text = String(value);
  const match = text.match(DATE_PATTERN);

  if (!match) {
    return text;
  }

  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

export function formatDisplayMonth(value, fallback = '') {
  if (!value) {
    return fallback;
  }

  const text = String(value);
  const match = text.match(MONTH_PATTERN);

  if (!match) {
    return formatDisplayDate(value, fallback);
  }

  const [, year, month] = match;
  return `${month}/${year}`;
}

export function formatDisplayDateTime(value, fallback = '') {
  if (!value) {
    return fallback;
  }

  const text = String(value);
  const dateText = formatDisplayDate(text, '');
  const timeMatch = text.match(TIME_PATTERN);

  if (!dateText) {
    return text;
  }

  return timeMatch ? `${dateText} ${timeMatch[1]}:${timeMatch[2]}` : dateText;
}
