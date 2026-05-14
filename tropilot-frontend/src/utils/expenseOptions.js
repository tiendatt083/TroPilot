export const EXPENSE_TYPE_OPTIONS = [
  { value: 'REPAIR', label: 'Repair' },
  { value: 'REPLACEMENT', label: 'Replacement' },
  { value: 'CLEANING', label: 'Cleaning' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'OPERATION', label: 'Operation' },
  { value: 'OTHER', label: 'Other' }
];

export const EXPENSE_STATUS_OPTIONS = [
  { value: 'VALID', label: 'Valid' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CANCELLED', label: 'Cancelled' }
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
