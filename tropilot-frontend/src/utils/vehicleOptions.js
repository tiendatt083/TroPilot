import { localizedOption, translateInterfaceText } from './interfaceTranslations.js';

export const VEHICLE_OWNER_TYPE_OPTIONS = [
  localizedOption('RESIDENT_HEAD', 'Head Resident'),
  localizedOption('ROOM_MEMBER', 'Room Member')
];

export const VEHICLE_TYPE_OPTIONS = [
  localizedOption('MOTORBIKE', 'Motorbike'),
  localizedOption('CAR', 'Car'),
  localizedOption('BICYCLE', 'Bicycle'),
  localizedOption('ELECTRIC_BIKE', 'Electric bike')
];

export function getVehicleOwnerTypeLabel(ownerType) {
  return VEHICLE_OWNER_TYPE_OPTIONS.find((option) => option.value === ownerType)?.label || ownerType;
}

export function getVehicleTypeLabel(vehicleType) {
  return VEHICLE_TYPE_OPTIONS.find((option) => option.value === vehicleType)?.label || vehicleType;
}

export function getVehicleStatusLabel(status) {
  if (!status) {
    return translateInterfaceText('Not available');
  }

  return translateInterfaceText(status.charAt(0) + status.slice(1).toLowerCase());
}

export function getVehicleStatusClass(status) {
  return `status-pill vehicle-status-${String(status || 'pending').toLowerCase()}`;
}
