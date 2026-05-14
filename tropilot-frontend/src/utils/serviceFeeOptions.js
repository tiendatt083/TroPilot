export const FEE_TYPE_OPTIONS = [
  { value: 'ROOM', label: 'Room' },
  { value: 'ELECTRICITY', label: 'Electricity' },
  { value: 'WATER', label: 'Water' },
  { value: 'INTERNET', label: 'Internet' },
  { value: 'CLEANING', label: 'Cleaning' },
  { value: 'GARBAGE', label: 'Garbage' },
  { value: 'PARKING', label: 'Parking' },
  { value: 'OTHER', label: 'Other' }
];

export const CALCULATION_TYPE_OPTIONS = [
  { value: 'FIXED', label: 'Fixed' },
  { value: 'BY_USAGE', label: 'By usage' },
  { value: 'BY_PERSON', label: 'By person' },
  { value: 'BY_QUANTITY', label: 'By quantity' }
];

export const SERVICE_FEE_VEHICLE_TYPE_OPTIONS = [
  { value: 'MOTORBIKE', label: 'Motorbike' },
  { value: 'CAR', label: 'Car' },
  { value: 'BICYCLE', label: 'Bicycle' },
  { value: 'ELECTRIC_BIKE', label: 'Electric bike' }
];

export function getFeeTypeLabel(value) {
  return FEE_TYPE_OPTIONS.find((option) => option.value === value)?.label || value;
}

export function getCalculationTypeLabel(value) {
  return CALCULATION_TYPE_OPTIONS.find((option) => option.value === value)?.label || value;
}

export function getServiceFeeVehicleTypeLabel(value) {
  if (!value) {
    return 'Not applicable';
  }

  return SERVICE_FEE_VEHICLE_TYPE_OPTIONS.find((option) => option.value === value)?.label || value;
}

export function isServiceFeeActive(serviceFee) {
  return Boolean(serviceFee.isActive ?? serviceFee.active);
}
