import { formatDisplayDate, formatDisplayDateTime } from './dateFormat.js';

export function formatFallbackEnumLabel(value) {
  if (!value) {
    return '';
  }

  return String(value)
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function formatEnumLabel(t, group, value) {
  if (!value) {
    return t('common.notAvailable');
  }

  return t(`enum.${group}.${value}`, { defaultValue: formatFallbackEnumLabel(value) });
}

export function formatDateTime(value, t) {
  if (!value) {
    return t('common.notProvided');
  }

  return formatDisplayDateTime(value, t('common.notProvided'));
}

export function formatDate(value, t) {
  if (!value) {
    return t('common.notProvided');
  }

  return formatDisplayDate(value, t('common.notProvided'));
}
