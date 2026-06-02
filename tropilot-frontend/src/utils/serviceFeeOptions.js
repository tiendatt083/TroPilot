export const FEE_TYPE_OPTIONS = [
  { value: 'ELECTRICITY', label: 'Electricity' },
  { value: 'WATER', label: 'Water' },
  { value: 'OTHER', label: 'Other' }
];

export const CALCULATION_TYPE_OPTIONS = [
  { value: 'FIXED', label: 'Fixed' },
  { value: 'BY_USAGE', label: 'By usage' },
  { value: 'BY_PERSON', label: 'By person' },
  { value: 'BY_QUANTITY', label: 'By quantity' }
];

export function getCalculationTypeOptionsForFeeType(feeType) {
  if (feeType === 'ELECTRICITY' || feeType === 'WATER') {
    return CALCULATION_TYPE_OPTIONS.filter((option) => option.value === 'BY_USAGE');
  }

  return CALCULATION_TYPE_OPTIONS.filter((option) => option.value !== 'BY_USAGE');
}

export function getDefaultCalculationTypeForFeeType(feeType) {
  if (feeType === 'ELECTRICITY' || feeType === 'WATER') {
    return 'BY_USAGE';
  }

  return 'FIXED';
}

export function getFeeTypeLabel(value) {
  return FEE_TYPE_OPTIONS.find((option) => option.value === value)?.label || value;
}

export function getCalculationTypeLabel(value) {
  return CALCULATION_TYPE_OPTIONS.find((option) => option.value === value)?.label || value;
}

export function isServiceFeeActive(serviceFee) {
  return Boolean(serviceFee.isActive ?? serviceFee.active);
}
