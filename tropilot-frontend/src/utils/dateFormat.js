const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/;
const MONTH_PATTERN = /^(\d{4})-(\d{2})$/;
const TIME_PATTERN = /[T\s](\d{2}):(\d{2})/;

function padDatePart(value) {
  return String(value).padStart(2, '0');
}

function toDateParts(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null;
    }

    return {
      year: value.getFullYear(),
      month: value.getMonth() + 1,
      day: value.getDate(),
      hour: value.getHours(),
      minute: value.getMinutes()
    };
  }

  const text = String(value);
  const dateMatch = text.match(DATE_PATTERN);

  if (!dateMatch) {
    return null;
  }

  const timeMatch = text.match(TIME_PATTERN);

  return {
    year: Number(dateMatch[1]),
    month: Number(dateMatch[2]),
    day: Number(dateMatch[3]),
    hour: timeMatch ? Number(timeMatch[1]) : null,
    minute: timeMatch ? Number(timeMatch[2]) : null
  };
}

export function formatDisplayDate(value, fallback = '') {
  if (!value) {
    return fallback;
  }

  const parts = toDateParts(value);

  if (!parts) {
    return String(value);
  }

  return `${padDatePart(parts.day)}/${padDatePart(parts.month)}/${parts.year}`;
}

export function formatDisplayMonth(value, fallback = '') {
  if (!value) {
    return fallback;
  }

  const text = String(value);
  const match = text.match(MONTH_PATTERN);

  if (match) {
    const [, year, month] = match;
    return `${month}/${year}`;
  }

  const parts = toDateParts(value);

  if (!parts) {
    return text;
  }

  return `${padDatePart(parts.month)}/${parts.year}`;
}

export function formatDisplayDateTime(value, fallback = '') {
  if (!value) {
    return fallback;
  }

  const parts = toDateParts(value);

  if (!parts) {
    return String(value);
  }

  const dateText = formatDisplayDate(value, fallback);

  return parts.hour !== null && parts.minute !== null
    ? `${dateText} ${padDatePart(parts.hour)}:${padDatePart(parts.minute)}`
    : dateText;
}

export function formatDateInputValue(date = new Date()) {
  const parts = toDateParts(date);

  if (!parts) {
    return '';
  }

  return `${parts.year}-${padDatePart(parts.month)}-${padDatePart(parts.day)}`;
}

export function formatMonthInputValue(date = new Date()) {
  const parts = toDateParts(date);

  if (!parts) {
    return '';
  }

  return `${parts.year}-${padDatePart(parts.month)}`;
}

export function addDaysToDateInput(dateValue, days) {
  const parts = toDateParts(dateValue);

  if (!parts || !days) {
    return null;
  }

  const date = new Date(parts.year, parts.month - 1, parts.day);
  date.setDate(date.getDate() + Number(days));

  return formatDateInputValue(date);
}

export function addMonthsToDateInput(dateValue, monthCount) {
  const parts = toDateParts(dateValue);

  if (!parts) {
    return '';
  }

  const targetMonthIndex = parts.month - 1 + monthCount;
  const lastTargetDay = new Date(parts.year, targetMonthIndex + 1, 0).getDate();
  const targetDate = new Date(parts.year, targetMonthIndex, Math.min(parts.day, lastTargetDay));

  return formatDateInputValue(targetDate);
}

export function getMonthFromDateInput(dateValue) {
  const parts = toDateParts(dateValue);

  if (!parts) {
    return '';
  }

  return `${parts.year}-${padDatePart(parts.month)}`;
}

export function getMonthDateRange(month) {
  if (!month) {
    return { min: undefined, max: undefined };
  }

  const [year, monthNumber] = month.split('-').map(Number);

  if (!Number.isInteger(year) || !Number.isInteger(monthNumber)) {
    return { min: undefined, max: undefined };
  }

  const lastDay = new Date(year, monthNumber, 0).getDate();

  return {
    min: `${month}-01`,
    max: `${month}-${padDatePart(lastDay)}`
  };
}
