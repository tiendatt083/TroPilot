import { localizedOption } from './interfaceTranslations.js';

export const EXPENSE_TYPE_OPTIONS = [
  localizedOption('REPAIR', 'Repair'),
  localizedOption('REPLACEMENT', 'Replacement'),
  localizedOption('CLEANING', 'Cleaning'),
  localizedOption('MAINTENANCE', 'Maintenance'),
  localizedOption('OPERATION', 'Operation'),
  localizedOption('OTHER', 'Other')
];

export const EXPENSE_STATUS_OPTIONS = [
  localizedOption('VALID', 'Valid'),
  localizedOption('PENDING', 'Pending'),
  localizedOption('CANCELLED', 'Cancelled')
];

export function getExpenseTypeLabel(expenseType) {
  return EXPENSE_TYPE_OPTIONS.find((option) => option.value === expenseType)?.label || expenseType;
}

export function getExpenseStatusLabel(status) {
  return EXPENSE_STATUS_OPTIONS.find((option) => option.value === status)?.label || status;
}

export function getExpenseStatusClass(status) {
  return `status-pill expense-status-${String(status || 'VALID').toLowerCase()}`;
}
