import { localizedOption } from './interfaceTranslations.js';

export const FEE_TYPE_OPTIONS = [
  localizedOption('ELECTRICITY', 'Electricity'),
  localizedOption('WATER', 'Water'),
  localizedOption('OTHER', 'Other')
];

export const CALCULATION_TYPE_OPTIONS = [
  localizedOption('FIXED', 'Per room'),
  localizedOption('BY_USAGE', 'By usage'),
  localizedOption('BY_PERSON', 'Per person')
];

export function getCalculationTypeOptionsForFeeType(feeType) {
  if (feeType === 'ELECTRICITY' || feeType === 'WATER') {
    return CALCULATION_TYPE_OPTIONS.filter((option) => option.value === 'BY_USAGE' || option.value === 'BY_PERSON');
  }

  return CALCULATION_TYPE_OPTIONS.filter((option) => option.value === 'FIXED' || option.value === 'BY_PERSON');
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
